const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function register({ name, email, password, role = 'patient' }) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    const error = new Error('Please enter your name.');
    error.status = 400;
    throw error;
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    const error = new Error('Please enter a valid email address.');
    error.status = 400;
    throw error;
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    const error = new Error('Password must be at least 6 characters long.');
    error.status = 400;
    throw error;
  }

  const validRoles = ['patient', 'doctor'];
  const userRole = validRoles.includes(role) ? role : 'patient';
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email already exists
  const existingRes = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [normalizedEmail]
  );

  if (existingRes.rows.length > 0) {
    const error = new Error('An account with this email already exists.');
    error.status = 409;
    throw error;
  }

  // Hash password with bcrypt
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Insert user
  const insertRes = await db.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
    [name.trim(), normalizedEmail, passwordHash, userRole]
  );

  const user = insertRes.rows[0];

  // Generate JWT token with role
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

async function login({ email, password }) {
  if (!email || !password) {
    const error = new Error('Please enter both email and password.');
    error.status = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const userRes = await db.query(
    'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
    [normalizedEmail]
  );

  if (userRes.rows.length === 0) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  const user = userRes.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role || 'patient' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'patient',
    },
  };
}

module.exports = {
  register,
  login,
};
