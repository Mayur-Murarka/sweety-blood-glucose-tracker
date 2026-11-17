const app = require('./app');
const env = require('./config/env');
const { initDb, query } = require('./config/db');
const { seedDatabase } = require('./db/seed');

async function startServer() {
  try {
    // Initialize database pool and schema
    await initDb();

    // Auto-seed if database is empty
    try {
      const userCountRes = await query('SELECT COUNT(*)::int AS count FROM users');
      const count = parseInt(userCountRes.rows[0].count, 10);
      if (count === 0) {
        console.log('[Auto-Seed] Database is empty. Seeding initial demo patient and sample readings...');
        await seedDatabase();
      }
    } catch (seedErr) {
      console.warn('[Auto-Seed] Note: Auto-seed skipped or failed:', seedErr.message);
    }

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
