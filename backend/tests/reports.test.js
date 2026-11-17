const request = require('supertest');
const app = require('../src/app');
const { initDb, query } = require('../src/config/db');

let userToken;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initDb();
});

beforeEach(async () => {
  await query('DELETE FROM readings');
  await query('DELETE FROM users');

  const user = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Report Tester', email: 'report@example.com', password: 'Password123!' });
  userToken = user.body.token;
});

describe('Reports API (/api/reports)', () => {
  const selectedDate = '2026-10-15';

  it('returns friendly empty state when no readings exist', async () => {
    const res = await request(app)
      .get(`/api/reports?date=${selectedDate}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.selectedDate).toBe(selectedDate);

    // Daily empty
    expect(res.body.daily.count).toBe(0);
    expect(res.body.daily.highest).toBeNull();
    expect(res.body.daily.lowest).toBeNull();
    expect(res.body.daily.average).toBeNull();
    expect(res.body.daily.hasReadings).toBe(false);
    expect(res.body.daily.readings).toEqual([]);

    // Month to date empty
    expect(res.body.monthToDate.count).toBe(0);
    expect(res.body.monthToDate.hasReadings).toBe(false);

    // Monthly empty
    expect(res.body.monthly.count).toBe(0);
    expect(res.body.monthly.hasReadings).toBe(false);
  });

  it('accurately computes daily, month-to-date, and previous month reports', async () => {
    // 1. Seed readings on selectedDate (15 Oct 2026)
    // Values: 90, 140, 115, 120 -> count = 4, highest = 140, lowest = 90, avg = (90+140+115+120)/4 = 465/4 = 116.25 -> rounded to 1 decimal: 116.3
    const dailyReadings = [
      { date: selectedDate, slot: 'Morning (fasting)', value: 90 },
      { date: selectedDate, slot: 'After breakfast', value: 140 },
      { date: selectedDate, slot: 'After lunch', value: 115 },
      { date: selectedDate, slot: 'After dinner', value: 120 },
    ];
    for (const r of dailyReadings) {
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(r);
    }

    // 2. Seed reading earlier in current month (5 Oct 2026)
    // Value: 100
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ date: '2026-10-05', slot: 'Morning (fasting)', value: 100 });
    // Total for MTD (1 Oct - 15 Oct): 4 + 1 = 5 readings
    // Values: 90, 140, 115, 120, 100 -> highest = 140, lowest = 90, sum = 565 / 5 = 113.0

    // 3. Seed reading in previous month (20 Sep 2026)
    // Values: 85, 130
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ date: '2026-09-20', slot: 'Morning (fasting)', value: 85 });
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ date: '2026-09-20', slot: 'After lunch', value: 130 });
    // Monthly (1 Sep - 30 Sep): count = 2, highest = 130, lowest = 85, avg = 215 / 2 = 107.5

    // Fetch reports
    const res = await request(app)
      .get(`/api/reports?date=${selectedDate}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);

    // Verify Daily
    expect(res.body.daily.count).toBe(4);
    expect(res.body.daily.highest).toBe(140);
    expect(res.body.daily.lowest).toBe(90);
    expect(res.body.daily.average).toBe(116.3);
    expect(res.body.daily.readings.length).toBe(4);
    expect(res.body.daily.readings[0].slot).toBe('Morning (fasting)');
    expect(res.body.daily.readings[1].slot).toBe('After breakfast');
    expect(res.body.daily.readings[2].slot).toBe('After lunch');
    expect(res.body.daily.readings[3].slot).toBe('After dinner');

    // Verify Month-to-date
    expect(res.body.monthToDate.startDate).toBe('2026-10-01');
    expect(res.body.monthToDate.endDate).toBe(selectedDate);
    expect(res.body.monthToDate.count).toBe(5);
    expect(res.body.monthToDate.highest).toBe(140);
    expect(res.body.monthToDate.lowest).toBe(90);
    expect(res.body.monthToDate.average).toBe(113.0);

    // Verify Monthly (Whole previous month: 1 Sep – 30 Sep 2026)
    expect(res.body.monthly.startDate).toBe('2026-09-01');
    expect(res.body.monthly.endDate).toBe('2026-09-30');
    expect(res.body.monthly.count).toBe(2);
    expect(res.body.monthly.highest).toBe(130);
    expect(res.body.monthly.lowest).toBe(85);
    expect(res.body.monthly.average).toBe(107.5);
  });
});
