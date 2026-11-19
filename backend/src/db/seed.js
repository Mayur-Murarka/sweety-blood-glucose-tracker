const bcrypt = require('bcryptjs');
const { initDb, query } = require('../config/db');

async function seedDatabase() {
  console.log('[Seed] Initializing database connection...');
  await initDb();

  const demoPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  // 1. Upsert Demo Patient User
  const demoEmail = 'demo@kenpath.com';
  const demoName = 'Demo Patient';

  let userRes = await query('SELECT id FROM users WHERE email = $1', [demoEmail]);
  let userId;

  if (userRes.rows.length === 0) {
    const insertUserRes = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'patient') RETURNING id`,
      [demoName, demoEmail, passwordHash]
    );
    userId = insertUserRes.rows[0].id;
    console.log(`[Seed] Created demo patient: ${demoEmail} (ID: ${userId})`);
  } else {
    userId = userRes.rows[0].id;
    await query('UPDATE users SET password_hash = $1, role = $2 WHERE id = $3', [passwordHash, 'patient', userId]);
    console.log(`[Seed] Existing demo patient found: ${demoEmail} (ID: ${userId})`);
  }

  // 2. Upsert Demo Doctor User
  const doctorEmail = 'doctor@kenpath.com';
  const doctorName = 'Dr. Sarah Mitchell, MD';

  let doctorRes = await query('SELECT id FROM users WHERE email = $1', [doctorEmail]);
  let doctorId;

  if (doctorRes.rows.length === 0) {
    const insertDoctorRes = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'doctor') RETURNING id`,
      [doctorName, doctorEmail, passwordHash]
    );
    doctorId = insertDoctorRes.rows[0].id;
    console.log(`[Seed] Created demo doctor: ${doctorEmail} (ID: ${doctorId})`);
  } else {
    doctorId = doctorRes.rows[0].id;
    await query('UPDATE users SET password_hash = $1, role = $2 WHERE id = $3', [passwordHash, 'doctor', doctorId]);
    console.log(`[Seed] Existing demo doctor found: ${doctorEmail} (ID: ${doctorId})`);
  }

  // 3. Link Patient to Doctor
  await query(
    `INSERT INTO doctor_patients (doctor_id, patient_id)
     VALUES ($1, $2)
     ON CONFLICT (doctor_id, patient_id) DO NOTHING`,
    [doctorId, userId]
  );
  console.log(`[Seed] Assigned patient ID ${userId} to doctor ID ${doctorId}`);

  // Clear previous readings for this demo user for clean idempotency
  await query('DELETE FROM readings WHERE user_id = $1', [userId]);

  // Current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate();

  const formatDate = (y, m, d) =>
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const readingsToInsert = [];

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

  // 3. Today: Morning (fasting), After breakfast, After lunch (leave dinner open)
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
  console.log(`  Patient:  ${demoEmail} / ${demoPassword}`);
  console.log(`  Doctor:   ${doctorEmail} / ${demoPassword}`);
  console.log(`  Total sample readings inserted: ${readingsToInsert.length}`);
  console.log('========================================================');
  return { userId, doctorId, totalReadings: readingsToInsert.length };
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = {
  seedDatabase,
};
