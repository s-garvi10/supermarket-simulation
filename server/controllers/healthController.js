import { getDbInfo } from '../config/db.js';

export function getHealth(req, res) {
  const info = getDbInfo();
  res.json({
    status: 'ok',
    message: 'Supermarket DBMS Backend is active',
    engine: info.engine,
    database: info.database,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
