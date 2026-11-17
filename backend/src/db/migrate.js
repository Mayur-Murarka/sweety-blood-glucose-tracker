const fs = require('fs');
const path = require('path');
const { initDb, query } = require('../config/db');

async function migrate() {
  try {
    console.log('[Migration] Starting database migration...');
    await initDb();
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await query(schemaSql);
    console.log('[Migration] Database tables created or verified successfully.');
    process.exit(0);
  } catch (err) {
    console.error('[Migration] Migration failed:', err);
    process.exit(1);
  }
}

migrate();
