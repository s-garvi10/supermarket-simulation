// Local development entry point only. Vercel uses /api/index.js instead.
import app, { ensureDb } from './app.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('🚀 Initializing Supermarket DBMS Database...');
    const dbStatus = await ensureDb();
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