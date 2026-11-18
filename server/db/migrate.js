import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🔄 Starting PostgreSQL migration...');

  const targetDb = process.env.PG_DATABASE || 'supermarket_db';
  const baseUser = process.env.PG_USER || 'postgres';
  const basePassword = process.env.PG_PASSWORD || 'postgres';
  const baseHost = process.env.PG_HOST || 'localhost';
  const basePort = Number(process.env.PG_PORT) || 5432;

  // 1. If not using a fixed connection string, verify/create target database first
  if (!process.env.DATABASE_URL) {
    const adminPool = new pg.Pool({
      host: baseHost,
      port: basePort,
      database: 'postgres', // default root database
      user: baseUser,
      password: basePassword,
      connectionTimeoutMillis: 5000,
    });

    try {
      const adminClient = await adminPool.connect();
      const checkRes = await adminClient.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [targetDb]
      );

      if (checkRes.rows.length === 0) {
        console.log(`📦 Database "${targetDb}" does not exist. Creating it now...`);
        await adminClient.query(`CREATE DATABASE "${targetDb}"`);
        console.log(`✅ Database "${targetDb}" created successfully!`);
      }
      adminClient.release();
    } catch (err) {
      if (err.message.includes('password authentication failed')) {
        console.error('\n❌ Authentication Error: Incorrect PostgreSQL password.');
        console.error(`👉 Please update "PG_PASSWORD" in your .env file with your actual PostgreSQL password.\n`);
        process.exit(1);
      }
      console.warn(`Notice during database check: ${err.message}`);
    } finally {
      await adminPool.end();
    }
  }

  // 2. Connect to the target database and execute migrations
  const targetConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: baseHost,
        port: basePort,
        database: targetDb,
        user: baseUser,
        password: basePassword,
        connectionTimeoutMillis: 5000,
      };

  const pool = new pg.Pool(targetConfig);

  try {
    const client = await pool.connect();
    console.log(`✅ Connected to database "${targetDb}" successfully.`);

    const schemaPath = path.join(__dirname, 'schema.sql');
    const routinesPath = path.join(__dirname, 'plpgsql_routines.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('📄 Applying schema.sql (tables, constraints, indexes)...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('✅ Schema tables, constraints, and indexes created.');
    }

    if (fs.existsSync(routinesPath)) {
      console.log('⚡ Applying plpgsql_routines.sql (triggers, procedures)...');
      const routinesSql = fs.readFileSync(routinesPath, 'utf8');
      await client.query(routinesSql);
      console.log('✅ PL/pgSQL routines, functions, and triggers installed.');
    }

    client.release();
    console.log('\n🎉 Database migration finished successfully! All tables and procedures are ready.');
  } catch (err) {
    if (err.message.includes('password authentication failed')) {
      console.error('\n❌ Authentication Error: Incorrect PostgreSQL password.');
      console.error(`👉 Please update "PG_PASSWORD" in your .env file with your actual PostgreSQL password.\n`);
    } else {
      console.error('❌ Migration failed:', err.message);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
