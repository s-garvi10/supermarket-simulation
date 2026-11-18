import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbEngine = 'none'; // 'postgresql' | 'sqlite'
let pgPool = null;
let sqliteDb = null;

const DATA_DIR = path.resolve(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const SQLITE_FILE = path.join(DATA_DIR, 'supermarket.db');

export function getDbInfo() {
  return {
    engine: dbEngine,
    connected: dbEngine !== 'none',
    database:
      dbEngine === 'postgresql'
        ? process.env.PG_DATABASE ||
          (process.env.DATABASE_URL
            ? new URL(process.env.DATABASE_URL).pathname.slice(1)
            : 'supermarket_db')
        : 'supermarket.db',
  };
}

export function isPostgres() {
  return dbEngine === 'postgresql';
}

/**
 * Execute a query against the active database engine
 * @param {string} text - SQL statement (with $1, $2 placeholders for PG)
 * @param {any[]} params - Parameter list
 */
export async function query(text, params = []) {
  if (dbEngine === 'postgresql') {
    return await pgPool.query(text, params);
  }

  if (dbEngine === 'sqlite') {
    // Map $1, $2, ... placeholders to ? and reorder/expand params for SQLite
    const paramIndices = [];
    const sqliteSql = text
      .replace(/\$(\d+)/g, (_, idx) => {
        paramIndices.push(Number(idx) - 1);
        return '?';
      })
      .replace(/\bILIKE\b/gi, 'LIKE');
    const mappedParams = paramIndices.length > 0 ? paramIndices.map((i) => params[i]) : params;
    const hasReturning = /RETURNING/i.test(sqliteSql);
    const isSelect = /^\s*(SELECT|PRAGMA)/i.test(sqliteSql) || hasReturning;
    const stmt = sqliteDb.prepare(sqliteSql);

    if (isSelect) {
      const rows = stmt.all(...mappedParams);
      return { rows, rowCount: rows.length };
    }
    const result = stmt.run(...mappedParams);
    return { rows: [], rowCount: result.changes };
  }

  throw new Error('Database is not initialized.');
}

/**
 * Obtain a dedicated client for transactions
 */
export async function getClient() {
  if (dbEngine === 'postgresql') {
    const client = await pgPool.connect();
    return client;
  }

  // SQLite transaction wrapper
  return {
    query: async (text, params = []) => {
      const paramIndices = [];
      const sqliteSql = text
        .replace(/\$(\d+)/g, (_, idx) => {
          paramIndices.push(Number(idx) - 1);
          return '?';
        })
        .replace(/\bILIKE\b/gi, 'LIKE');
      const mappedParams = paramIndices.length > 0 ? paramIndices.map((i) => params[i]) : params;
      const hasReturning = /RETURNING/i.test(sqliteSql);
      const isSelect = /^\s*(SELECT|PRAGMA)/i.test(sqliteSql) || hasReturning;
      const stmt = sqliteDb.prepare(sqliteSql);
      if (isSelect) {
        const rows = stmt.all(...mappedParams);
        return { rows, rowCount: rows.length };
      }
      const res = stmt.run(...mappedParams);
      return { rows: [], rowCount: res.changes };
    },
    release: () => {},
  };
}

/**
 * Automatically run schema and PL/pgSQL routines on PostgreSQL
 */
export async function autoMigratePostgres(pool) {
  try {
    const check = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers');"
    );

    if (!check.rows[0].exists) {
      console.log('📦 Empty PostgreSQL database detected. Applying DDL schema & PL/pgSQL routines...');
      const schemaPath = path.resolve(__dirname, '../db/schema.sql');
      const routinesPath = path.resolve(__dirname, '../db/plpgsql_routines.sql');

      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
        console.log('  -> Relational tables & indexes created.');
      }

      if (fs.existsSync(routinesPath)) {
        const routinesSql = fs.readFileSync(routinesPath, 'utf8');
        await pool.query(routinesSql);
        console.log('  -> PL/pgSQL stored procedures, triggers, and functions installed.');
      }
      console.log('🎉 PostgreSQL database initialization complete!');
    }
  } catch (err) {
    console.error('⚠️  Migration check error:', err.message);
  }
}

/**
 * Initialize SQLite schema for seamless zero-config fallback
 */
function initSqliteSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      customer_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memberships (
      membership_id TEXT PRIMARY KEY,
      customer_id TEXT UNIQUE NOT NULL,
      card_number TEXT UNIQUE NOT NULL,
      tier TEXT NOT NULL DEFAULT 'Silver',
      points INTEGER NOT NULL DEFAULT 0,
      joined_on TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rewards (
      reward_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      points_cost INTEGER NOT NULL,
      discount REAL NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS purchases (
      purchase_id TEXT PRIMARY KEY,
      customer_id TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      cashier_name TEXT NOT NULL,
      purchase_date TEXT NOT NULL,
      gross_amount REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      points_earned INTEGER NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL,
      reward_id TEXT,
      reward_name TEXT,
      notes TEXT,
      items TEXT DEFAULT '[]',
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    );

    CREATE TABLE IF NOT EXISTS redemptions (
      redemption_id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      reward_id TEXT NOT NULL,
      reward_name TEXT NOT NULL,
      points_spent INTEGER NOT NULL,
      redeemed_at TEXT NOT NULL,
      voucher_code TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    );
  `);
}

/**
 * Initialize PostgreSQL connection or fallback to SQLite
 */
export async function initDatabase() {
  const forceEngine = process.env.DB_ENGINE;

  if (forceEngine !== 'sqlite') {
    const pgConfig = process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          connectionTimeoutMillis: 3000,
        }
      : {
          host: process.env.PG_HOST || 'localhost',
          port: Number(process.env.PG_PORT) || 5432,
          database: process.env.PG_DATABASE || 'supermarket_db',
          user: process.env.PG_USER || 'postgres',
          password: process.env.PG_PASSWORD || 'postgres',
          connectionTimeoutMillis: 3000,
          max: 20,
          idleTimeoutMillis: 30000,
        };

    try {
      const pool = new pg.Pool(pgConfig);
      const client = await pool.connect();
      console.log('✅ Connected to PostgreSQL database successfully!');
      client.release();

      pgPool = pool;
      dbEngine = 'postgresql';

      await autoMigratePostgres(pool);
      return { engine: 'postgresql', status: 'connected' };
    } catch (err) {
      if (forceEngine === 'postgres' || forceEngine === 'postgresql') {
        console.error('❌ Failed to connect to requested PostgreSQL instance:', err.message);
        throw err;
      }
      console.warn(
        `⚠️  PostgreSQL not reachable at ${process.env.PG_HOST || 'localhost'}:${process.env.PG_PORT || 5432} (${err.message}).`
      );
      console.log('ℹ️  Using local embedded SQLite mode for uninterrupted runtime.');
    }
  }

  // Fallback to SQLite
  try {
    sqliteDb = new DatabaseSync(SQLITE_FILE);
    dbEngine = 'sqlite';
    initSqliteSchema(sqliteDb);
    console.log('✅ SQLite database initialized at:', SQLITE_FILE);
    return { engine: 'sqlite', status: 'connected', path: SQLITE_FILE };
  } catch (err) {
    console.error('❌ Failed to initialize SQLite database fallback:', err);
    throw err;
  }
}

export { pgPool, sqliteDb };
