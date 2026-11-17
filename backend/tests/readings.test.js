const request = require('supertest');
const app = require('../src/app');
const { initDb, query } = require('../src/config/db');

let userToken;
let otherUserToken;
let userId;
let otherUserId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initDb();
});

beforeEach(async () => {
  await query('DELETE FROM readings');
  await query('DELETE FROM users');

  // Register main test user
  const user1 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Patient One', email: 'p1@example.com', password: 'Password123!' });
  userToken = user1.body.token;
  userId = user1.body.user.id;

  // Register secondary test user for multi-tenancy verification
  const user2 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Patient Two', email: 'p2@example.com', password: 'Password123!' });
  otherUserToken = user2.body.token;
  otherUserId = user2.body.user.id;
});

describe('Readings API (/api/readings)', () => {
  const validDate = '2026-10-15';

  describe('Validation Rules (Required Specification Checks)', () => {
    it('1. Value is required -> "Please enter a glucose value."', async () => {
      const resNull = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: validDate, slot: 'Morning (fasting)', value: null });

      expect(resNull.status).toBe(400);
      expect(resNull.body.error).toBe('Please enter a glucose value.');

      const resEmpty = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: validDate, slot: 'Morning (fasting)', value: '' });

      expect(resEmpty.status).toBe(400);
      expect(resEmpty.body.error).toBe('Please enter a glucose value.');
    });

    it('2. Value must be a whole number between 40 and 600 -> "Value must be between 40 and 600 mg/dl."', async () => {
      // Below 40
      const resLow = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: validDate, slot: 'Morning (fasting)', value: 39 });
      expect(resLow.status).toBe(400);
      expect(resLow.body.error).toBe('Value must be between 40 and 600 mg/dl.');

      // Above 600
      const resHigh = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: validDate, slot: 'Morning (fasting)', value: 601 });
      expect(resHigh.status).toBe(400);
      expect(resHigh.body.error).toBe('Value must be between 40 and 600 mg/dl.');

      // Decimal (not whole number)
      const resDecimal = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: validDate, slot: 'Morning (fasting)', value: 120.5 });
      expect(resDecimal.status).toBe(400);
      expect(resDecimal.body.error).toBe('Value must be between 40 and 600 mg/dl.');

      // Non-numeric string
      const resAlpha = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: validDate, slot: 'Morning (fasting)', value: 'high' });
      expect(resAlpha.status).toBe(400);
      expect(resAlpha.body.error).toBe('Value must be between 40 and 600 mg/dl.');
    });

    it('3. Date cannot be in the future -> "Date cannot be in the future."', async () => {
      // Create a date in the far future
      const futureDate = '2099-12-31';
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: futureDate, slot: 'Morning (fasting)', value: 110 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Date cannot be in the future.');
    });

    it('4. Only one reading per slot per day -> "You already have an After lunch reading for this date."', async () => {
      // Add first reading for After lunch
      const res1 = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: validDate, slot: 'After lunch', value: 130 });
      expect(res1.status).toBe(201);

      // Attempt to add second reading for same slot on same date
      const res2 = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: validDate, slot: 'After lunch', value: 145 });

      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('You already have an After lunch reading for this date.');
    });

    it('5. Maximum 4 readings per day -> "You can add only 4 readings per day."', async () => {
      const slots = [
        'Morning (fasting)',
        'After breakfast',
        'After lunch',
        'After dinner',
      ];

      // Add all 4 slots successfully
      for (const slot of slots) {
        const res = await request(app)
          .post('/api/readings')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ date: validDate, slot, value: 110 });
        expect(res.status).toBe(201);
      }

      // Try adding another reading (count is already 4)
      const resExcess = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: validDate, slot: 'Morning (fasting)', value: 120 });

      expect(resExcess.status).toBe(400);
      expect(resExcess.body.error).toBe('You can add only 4 readings per day.');
    });
  });

  describe('CRUD & Multi-tenancy Isolation', () => {
    it('creates reading and allows user to view only their own readings', async () => {
      // User 1 creates reading
      const r1 = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: '2026-10-14', slot: 'Morning (fasting)', value: 95 });
      expect(r1.status).toBe(201);

      // User 2 creates reading
      const r2 = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ date: '2026-10-14', slot: 'Morning (fasting)', value: 105 });
      expect(r2.status).toBe(201);

      // User 1 lists readings
      const list1 = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${userToken}`);
      expect(list1.status).toBe(200);
      expect(list1.body.readings.length).toBe(1);
      expect(list1.body.readings[0].glucose_value).toBe(95);

      // User 2 lists readings
      const list2 = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${otherUserToken}`);
      expect(list2.status).toBe(200);
      expect(list2.body.readings.length).toBe(1);
      expect(list2.body.readings[0].glucose_value).toBe(105);

      // User 1 cannot view or modify User 2's reading
      const getOther = await request(app)
        .get(`/api/readings/${r2.body.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(getOther.status).toBe(404);

      const putOther = await request(app)
        .put(`/api/readings/${r2.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: '2026-10-14', slot: 'Morning (fasting)', value: 99 });
      expect(putOther.status).toBe(404);

      const delOther = await request(app)
        .delete(`/api/readings/${r2.body.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(delOther.status).toBe(404);
    });

    it('edits an existing reading without false duplicate slot trigger', async () => {
      const created = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: validDate, slot: 'Morning (fasting)', value: 95 });

      const updated = await request(app)
        .put(`/api/readings/${created.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: validDate, slot: 'Morning (fasting)', value: 98 });

      expect(updated.status).toBe(200);
      expect(updated.body.glucose_value).toBe(98);
    });

    it('deletes an existing reading', async () => {
      const created = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ date: validDate, slot: 'Morning (fasting)', value: 95 });

      const delRes = await request(app)
        .delete(`/api/readings/${created.body.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(delRes.status).toBe(200);

      // Verify it is gone
      const checkRes = await request(app)
        .get(`/api/readings/${created.body.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(checkRes.status).toBe(404);
    });

    it('supports pagination on GET /readings (?page=1&limit=20)', async () => {
      // Seed 25 readings across different dates
      for (let i = 1; i <= 25; i++) {
        const dayStr = String(i).padStart(2, '0');
        await request(app)
          .post('/api/readings')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ date: `2026-09-${dayStr}`, slot: 'Morning (fasting)', value: 90 + i });
      }

      // Page 1 with limit 20
      const page1 = await request(app)
        .get('/api/readings?page=1&limit=20')
        .set('Authorization', `Bearer ${userToken}`);

      expect(page1.status).toBe(200);
      expect(page1.body.readings.length).toBe(20);
      expect(page1.body.pagination).toEqual({
        total: 25,
        page: 1,
        limit: 20,
        totalPages: 2,
      });

      // Page 2
      const page2 = await request(app)
        .get('/api/readings?page=2&limit=20')
        .set('Authorization', `Bearer ${userToken}`);

      expect(page2.status).toBe(200);
      expect(page2.body.readings.length).toBe(5);
    });
  });
});
