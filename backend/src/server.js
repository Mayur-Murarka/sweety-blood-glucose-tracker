const app = require('./app');
const env = require('./config/env');
const { initDb } = require('./config/db');

async function startServer() {
  try {
    // Initialize database pool and schema
    await initDb();

    app.listen(env.PORT, () => {
      console.log(`===============================================`);
      console.log(`  Sweety Blood Glucose Tracker API running`);
      console.log(`  Port: ${env.PORT}`);
      console.log(`  Environment: ${env.NODE_ENV}`);
      console.log(`  Health: http://localhost:${env.PORT}/api/health`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
