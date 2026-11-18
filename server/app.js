import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, getDbInfo } from './config/db.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

dotenv.config();

const app = express();

// Run initDatabase() once per server instance (local start or serverless cold start).
let dbReady = null;
export function ensureDb() {
  if (!dbReady) {
    dbReady = initDatabase().catch((err) => {
      dbReady = null; // allow a retry on the next request
      throw err;
    });
  }
  return dbReady;
}

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Make sure the database is initialised before any route runs
app.use(async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    next(err);
  }
});

// Root Info Endpoint
app.get('/', (req, res) => {
  const info = getDbInfo();
  res.json({
    app: 'Supermarket DBMS (FreshMart) Backend',
    version: '2.0.0',
    status: 'online',
    database: info,
    documentation: '/api/health',
  });
});

// Mount modular API routes
app.use('/api', apiRoutes);

// Centralized Error Handler
app.use(errorHandler);

export default app;
