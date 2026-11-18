import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, getDbInfo } from './config/db.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

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

// Initialize database then start server
async function startServer() {
  try {
    console.log('🚀 Initializing Supermarket DBMS Database...');
    const dbStatus = await initDatabase();
    console.log(`✅ Database ready! Engine: ${dbStatus.engine.toUpperCase()}`);

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` FreshMart Supermarket Backend Server is running!`);
      console.log(` URL: http://localhost:${PORT}`);
      console.log(` Health API: http://localhost:${PORT}/api/health`);
      console.log(` Database: ${dbStatus.engine.toUpperCase()}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('❌ Failed to start backend server:', err);
    process.exit(1);
  }
}

startServer();
