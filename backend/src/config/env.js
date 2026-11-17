require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'sweety-super-secret-jwt-key-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/sweety_db',
  // When USE_MEMORY_DB=true or when PostgreSQL cannot be reached, fallback to pg-mem
  USE_MEMORY_DB: process.env.USE_MEMORY_DB === 'true',
};
