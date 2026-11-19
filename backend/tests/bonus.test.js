const request = require('supertest');
const app = require('../src/app');
const { initDb, query } = require('../src/config/db');
const { getCachedReports, invalidateUserReports } = require('../src/config/redis');
const { processDailyReminders } = require('../src/queue/reminderQueue');

let patientToken;
let patientId;
let doctorToken;
let doctorId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initDb();
});

beforeEach(async () => {
  await query('DELETE FROM doctor_patients');
  await query('DELETE FROM readings');
  await query('DELETE FROM users');

  // Register a patient
  const patientRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'John Patient',
      email: 'john.patient@example.com',
      password: 'Password123!',
      role: 'patient',
    });
  patientToken = patientRes.body.token;
  patientId = patientRes.body.user.id;

  // Register a doctor
  const doctorRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Dr. House',
      email: 'dr.house@example.com',
      password: 'Password123!',
      role: 'doctor',
    });
  doctorToken = doctorRes.body.token;
  doctorId = doctorRes.body.user.id;
});

describe('Senior Bonus Tasks - Redis Caching, BullMQ, & Doctor Role', () => {
  describe('1. Redis Caching & Invalidation', () => {
    const testDate = '2026-10-15';

    it('caches report in Redis and serves from cache on subsequent request', async () => {
      // Add a reading
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ date: testDate, slot: 'Morning (fasting)', value: 100 });

      // First fetch: Cache Miss (fromCache: false)
      const res1 = await request(app)
        .get(`/api/reports?date=${testDate}`)
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res1.status).toBe(200);
      expect(res1.body.fromCache).toBe(false);

      // Verify cached in Redis
      const cached = await getCachedReports(patientId, testDate);
      expect(cached).not.toBeNull();
      expect(cached.daily.highest).toBe(100);

      // Second fetch: Cache Hit (fromCache: true)
      const res2 = await request(app)
        .get(`/api/reports?date=${testDate}`)
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res2.status).toBe(200);
      expect(res2.body.fromCache).toBe(true);
      expect(res2.body.daily.highest).toBe(100);
    });

    it('invalidates Redis cache when a reading is added, updated, or deleted', async () => {
      // Add initial reading and populate cache
      const created = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ date: testDate, slot: 'Morning (fasting)', value: 95 });

      await request(app)
        .get(`/api/reports?date=${testDate}`)
        .set('Authorization', `Bearer ${patientToken}`);

      // Verify cached
      let cached = await getCachedReports(patientId, testDate);
      expect(cached).not.toBeNull();

      // Add second reading -> triggers invalidateUserReports
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ date: testDate, slot: 'After lunch', value: 130 });

      // Verify cache was cleared
      cached = await getCachedReports(patientId, testDate);
      expect(cached).toBeNull();
    });
  });

  describe('2. Doctor Role & RBAC', () => {
    it('restricts /api/doctor endpoints to doctor role accounts only', async () => {
      // Patient trying to access doctor portal gets 403
      const patientAttempt = await request(app)
        .get('/api/doctor/patients')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(patientAttempt.status).toBe(403);
      expect(patientAttempt.body.error).toContain('requires the "doctor" role');

      // Doctor accessing gets 200
      const doctorAttempt = await request(app)
        .get('/api/doctor/patients')
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(doctorAttempt.status).toBe(200);
      expect(doctorAttempt.body.patients).toEqual([]);
    });

    it('allows doctor to assign a patient and view their reports', async () => {
      // Doctor assigns patient by email
      const assignRes = await request(app)
        .post('/api/doctor/assign')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ email: 'john.patient@example.com' });
      expect(assignRes.status).toBe(201);

      // Add a reading for patient
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ date: '2026-10-15', slot: 'Morning (fasting)', value: 112 });

      // Doctor views patient's reports
      const reportsRes = await request(app)
        .get(`/api/doctor/patients/${patientId}/reports?date=2026-10-15`)
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(reportsRes.status).toBe(200);
      expect(reportsRes.body.patient.email).toBe('john.patient@example.com');
      expect(reportsRes.body.daily.highest).toBe(112);
      expect(reportsRes.body.daily.average).toBe(112.0);
    });

    it('prevents doctor from viewing unassigned patients', async () => {
      // Patient is not assigned to doctor
      const reportsRes = await request(app)
        .get(`/api/doctor/patients/${patientId}/reports?date=2026-10-15`)
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(reportsRes.status).toBe(403);
      expect(reportsRes.body.error).toContain('not assigned to your clinical account');
    });
  });

  describe('3. BullMQ Daily Reminder Job', () => {
    it('evaluates patients and identifies those with fewer than 4 readings today', async () => {
      const today = '2026-11-19';

      // Patient has logged only 1 reading
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ date: today, slot: 'Morning (fasting)', value: 92 });

      const result = await processDailyReminders(today);

      expect(result.totalPatientsEvaluated).toBe(1);
      expect(result.remindersCount).toBe(1);
      expect(result.reminders[0].patientId).toBe(patientId);
      expect(result.reminders[0].readingsCount).toBe(1);
    });
  });
});
