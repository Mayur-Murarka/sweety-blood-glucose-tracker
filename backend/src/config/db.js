const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const env = require('./env');

let pool = null;
let isMemoryMode = false;

function createMemoryPool() {
  const { newDb } = require('pg-mem');
  const db = newDb();

  // Register round function
  const roundFn = (val, scale) => {
    if (val === null || val === undefined) return null;
    const factor = Math.pow(10, scale || 0);
    return Math.round(Number(val) * factor) / factor;
  };

  db.public.registerFunction({
    name: 'round',
    args: ['float', 'integer'],
    returns: 'float',
    implementation: roundFn,
  });

  db.public.registerFunction({
    name: 'round',
    args: ['numeric', 'integer'],
    returns: 'numeric',
    implementation: roundFn,
  });

  // Register to_char function
  const toCharFn = (val, fmt) => {
    if (!val) return null;
    if (typeof val === 'string') return val.slice(0, 10);
    const d = new Date(val);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  db.public.registerFunction({
    name: 'to_char',
    args: ['date', 'text'],
    returns: 'text',
    implementation: toCharFn,
  });

  db.public.registerFunction({
    name: 'to_char',
    args: ['timestamp', 'text'],
    returns: 'text',
    implementation: toCharFn,
  });

  const adapter = db.adapters.createPg();
  const memPool = new adapter.Pool();
  return { memPool, memDb: db };
}

async function initDb() {
  const schemaPath = path.join(__dirname, '../db/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  if (env.USE_MEMORY_DB || process.env.NODE_ENV === 'test') {
    if (!pool) {
      console.log('[Database] Initializing in-memory PostgreSQL (pg-mem)...');
      const { memPool } = createMemoryPool();
      pool = memPool;
      isMemoryMode = true;
      await pool.query(schemaSql);
      console.log('[Database] In-memory PostgreSQL schema initialized successfully.');
    }
    return pool;
  }

  try {
    console.log(`[Database] Connecting to PostgreSQL at ${env.DATABASE_URL.replace(/:[^:@]*@/, ':****@')}...`);
    const pgPool = new Pool({
      connectionString: env.DATABASE_URL,
      connectionTimeoutMillis: 3000,
    });

    // Test connection with a fast query
    await pgPool.query('SELECT 1');
    pool = pgPool;
    isMemoryMode = false;
    console.log('[Database] Connected to PostgreSQL successfully.');

    // Auto-run schema migrations
    await pool.query(schemaSql);
    console.log('[Database] PostgreSQL schema verified/migrated.');
    return pool;
  } catch (err) {
    console.warn(`[Database] PostgreSQL connection failed: ${err.message}`);
    console.log('[Database] Falling back to in-memory PostgreSQL for seamless local development.');
    const { memPool } = createMemoryPool();
    pool = memPool;
    isMemoryMode = true;
    await pool.query(schemaSql);
    console.log('[Database] In-memory PostgreSQL schema initialized successfully.');
    return pool;
  }
}

async function query(text, params) {
  if (!pool) {
    await initDb();
  }
  return pool.query(text, params);
}

function getPool() {
  return pool;
}

function isInMemory() {
  return isMemoryMode;
}

module.exports = {
  initDb,
  query,
  getPool,
  isInMemory,
  createMemoryPool,
};
