const bcrypt = require('bcryptjs');
const { initDb, query } = require('../config/db');

async function seed() {
  try {
    console.log('[Seed] Initializing database connection...');
    await initDb();

    // 1. Upsert Demo User
    const demoEmail = 'demo@kenpath.com';
    const demoName = 'Demo Patient';
    const demoPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(demoPassword, 10);

    let userRes = await query('SELECT id FROM users WHERE email = $1', [demoEmail]);
    let userId;

    if (userRes.rows.length === 0) {
      const insertUserRes = await query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [demoName, demoEmail, passwordHash]
      );
      userId = insertUserRes.rows[0].id;
      console.log(`[Seed] Created demo user: ${demoEmail} (ID: ${userId})`);
    } else {
      userId = userRes.rows[0].id;
      // Update password hash to ensure credentials work
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
      console.log(`[Seed] Existing demo user found: ${demoEmail} (ID: ${userId})`);
    }

    // Clear previous readings for this demo user for clean idempotency
    await query('DELETE FROM readings WHERE user_id = $1', [userId]);
    console.log(`[Seed] Cleared old demo readings for user ID ${userId}`);

    // Generate realistic readings
    // Current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();

    const formatDate = (y, m, d) =>
      `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const readingsToInsert = [];

    // Helper to generate realistic blood glucose values
    // Fasting morning: 75 - 110 mg/dl
    // After breakfast: 110 - 155 mg/dl
    // After lunch: 105 - 145 mg/dl
    // After dinner: 110 - 150 mg/dl
    function getRealisticValue(slot, dayOffset = 0) {
      const seedVal = (dayOffset * 7 + slot.length) % 15;
      switch (slot) {
        case 'Morning (fasting)':
          return 85 + seedVal;
        case 'After breakfast':
          return 125 + seedVal * 2;
        case 'After lunch':
          return 115 + seedVal;
        case 'After dinner':
          return 120 + seedVal;
        default:
          return 110;
      }
    }

    // 1. Previous Month (whole previous month)
    let prevYear = currentYear;
    let prevMonth = currentMonth - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = currentYear - 1;
    }
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();

    for (let d = 1; d <= daysInPrevMonth; d++) {
      const dateStr = formatDate(prevYear, prevMonth, d);
      // Add all 4 slots for previous month
      readingsToInsert.push({ date: dateStr, slot: 'Morning (fasting)', value: getRealisticValue('Morning (fasting)', d) });
      readingsToInsert.push({ date: dateStr, slot: 'After breakfast', value: getRealisticValue('After breakfast', d) });
      readingsToInsert.push({ date: dateStr, slot: 'After lunch', value: getRealisticValue('After lunch', d) });
      readingsToInsert.push({ date: dateStr, slot: 'After dinner', value: getRealisticValue('After dinner', d) });
    }

    // 2. Current Month (Month-to-date up to yesterday)
    for (let d = 1; d < currentDay; d++) {
      const dateStr = formatDate(currentYear, currentMonth, d);
      readingsToInsert.push({ date: dateStr, slot: 'Morning (fasting)', value: getRealisticValue('Morning (fasting)', d + 30) });
      readingsToInsert.push({ date: dateStr, slot: 'After breakfast', value: getRealisticValue('After breakfast', d + 30) });
      readingsToInsert.push({ date: dateStr, slot: 'After lunch', value: getRealisticValue('After lunch', d + 30) });
      readingsToInsert.push({ date: dateStr, slot: 'After dinner', value: getRealisticValue('After dinner', d + 30) });
    }

    // 3. Today: Morning (fasting), After breakfast, After lunch (leave dinner empty for testing)
    const todayStr = formatDate(currentYear, currentMonth, currentDay);
    readingsToInsert.push({ date: todayStr, slot: 'Morning (fasting)', value: 94 });
    readingsToInsert.push({ date: todayStr, slot: 'After breakfast', value: 138 });
    readingsToInsert.push({ date: todayStr, slot: 'After lunch', value: 124 });

    console.log(`[Seed] Inserting ${readingsToInsert.length} sample readings...`);

    for (const r of readingsToInsert) {
      await query(
        `INSERT INTO readings (user_id, reading_date, slot, glucose_value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, reading_date, slot) DO UPDATE
         SET glucose_value = EXCLUDED.glucose_value`,
        [userId, r.date, r.slot, r.value]
      );
    }

    console.log('========================================================');
    console.log('  Database seeding completed successfully!');
    console.log('  Demo credentials:');
    console.log(`  Email:    ${demoEmail}`);
    console.log(`  Password: ${demoPassword}`);
    console.log(`  Total sample readings inserted: ${readingsToInsert.length}`);
    console.log('========================================================');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Seeding failed:', err);
    process.exit(1);
  }
}

seed();
