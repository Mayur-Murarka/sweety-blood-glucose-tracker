const request = require('supertest');
const app = require('../src/app');
const { initDb, query } = require('../src/config/db');

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initDb();
});

beforeEach(async () => {
  await query('DELETE FROM readings');
  await query('DELETE FROM users');
});

describe('Authentication API (/api/auth)', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new user successfully and returns token and user info', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toEqual({
        id: expect.any(Number),
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'patient',
      });

      // Verify password in DB is hashed and never stored plain text
      const dbUser = await query('SELECT password_hash FROM users WHERE email = $1', ['jane@example.com']);
      expect(dbUser.rows.length).toBe(1);
      expect(dbUser.rows[0].password_hash).not.toBe('Password123!');
      expect(dbUser.rows[0].password_hash.startsWith('$2')).toBe(true);
    });

    it('rejects registration when email already exists', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'First User',
          email: 'duplicate@example.com',
          password: 'Password123!',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: 'duplicate@example.com',
          password: 'Password456!',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('An account with this email already exists.');
    });

    it('validates required fields and email format', async () => {
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({ name: '', email: 'valid@example.com', password: 'Password123!' });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post('/api/auth/register')
        .send({ name: 'User', email: 'not-an-email', password: 'Password123!' });
      expect(res2.status).toBe(400);

      const res3 = await request(app)
        .post('/api/auth/register')
        .send({ name: 'User', email: 'valid@example.com', password: '123' });
      expect(res3.status).toBe(400);
      expect(res3.body.error).toBe('Password must be at least 6 characters long.');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Smith',
          email: 'alice@example.com',
          password: 'SecretPassword123',
        });
    });

    it('logs in successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'SecretPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('alice@example.com');
      expect(res.body.user.name).toBe('Alice Smith');
    });

    it('rejects login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password.');
    });

    it('rejects login with nonexistent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'SecretPassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password.');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns user profile when valid token provided', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Token User',
          email: 'token@example.com',
          password: 'Password123!',
        });

      const token = regRes.body.token;

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe('token@example.com');
    });

    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required. Please log in.');
    });
  });
});
