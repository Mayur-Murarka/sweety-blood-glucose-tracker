const db = require('../config/db');
const { invalidateUserReports } = require('../config/redis');
const {
  validateReadingInput,
  getDuplicateSlotMessage,
} = require('../utils/validation');

/**
 * Creates a new glucose reading
 */
async function createReading({ userId, date, slot, value }) {
  // 1. Base input validation
  const validation = validateReadingInput({ date, slot, value });
  if (!validation.valid) {
    const error = new Error(validation.error);
    error.status = 400;
    throw error;
  }

  const cleanData = validation.data;

  // 2. Check daily maximum 4 readings
  const countRes = await db.query(
    'SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2',
    [userId, cleanData.date]
  );
  const currentCount = parseInt(countRes.rows[0].count, 10);
  if (currentCount >= 4) {
    const error = new Error('You can add only 4 readings per day.');
    error.status = 400;
    throw error;
  }

  // 3. Check duplicate slot for date
  const duplicateRes = await db.query(
    'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND slot = $3',
    [userId, cleanData.date, cleanData.slot]
  );
  if (duplicateRes.rows.length > 0) {
    const error = new Error(getDuplicateSlotMessage(cleanData.slot));
    error.status = 400;
    throw error;
  }

  // 4. Insert reading
  const insertRes = await db.query(
    `INSERT INTO readings (user_id, reading_date, slot, glucose_value)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, glucose_value, created_at, updated_at`,
    [userId, cleanData.date, cleanData.slot, cleanData.value]
  );

  // Invalidate Redis reports cache on data change
  await invalidateUserReports(userId);

  return insertRes.rows[0];
}

/**
 * Lists readings with optional pagination and filters
 */
async function getReadings({ userId, page = 1, limit = 20, date, month }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const conditions = ['user_id = $1'];
  const params = [userId];

  if (date) {
    params.push(date);
    conditions.push(`reading_date = $${params.length}`);
  } else if (month) {
    // Format YYYY-MM
    params.push(`${month}-01`);
    conditions.push(`reading_date >= $${params.length}`);
    // end of month
    const [year, m] = month.split('-').map(Number);
    const lastDay = new Date(year, m, 0).getDate();
    params.push(`${month}-${String(lastDay).padStart(2, '0')}`);
    conditions.push(`reading_date <= $${params.length}`);
  }

  const whereClause = conditions.join(' AND ');

  // Get total count
  const countRes = await db.query(
    `SELECT COUNT(*)::int AS total FROM readings WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].total, 10);

  // Get paginated records
  const queryParams = [...params, limitNum, offset];
  const listRes = await db.query(
    `SELECT id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, glucose_value, created_at, updated_at
     FROM readings
     WHERE ${whereClause}
     ORDER BY reading_date DESC,
       CASE slot
         WHEN 'Morning (fasting)' THEN 1
         WHEN 'After breakfast' THEN 2
         WHEN 'After lunch' THEN 3
         WHEN 'After dinner' THEN 4
         ELSE 5
       END ASC,
       id DESC
     LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
    queryParams
  );

  return {
    readings: listRes.rows,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
}

/**
 * Gets a single reading by ID
 */
async function getReadingById({ userId, id }) {
  const res = await db.query(
    `SELECT id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, glucose_value, created_at, updated_at
     FROM readings
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (res.rows.length === 0) {
    const error = new Error('Reading not found.');
    error.status = 404;
    throw error;
  }

  return res.rows[0];
}

/**
 * Updates an existing reading
 */
async function updateReading({ userId, id, date, slot, value }) {
  // Check reading exists and belongs to user
  const existing = await getReadingById({ userId, id });

  // Validate input
  const validation = validateReadingInput({ date, slot, value });
  if (!validation.valid) {
    const error = new Error(validation.error);
    error.status = 400;
    throw error;
  }

  const cleanData = validation.data;

  // If date changed, check max 4 readings for new date
  if (cleanData.date !== existing.reading_date) {
    const countRes = await db.query(
      'SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2',
      [userId, cleanData.date]
    );
    const count = parseInt(countRes.rows[0].count, 10);
    if (count >= 4) {
      const error = new Error('You can add only 4 readings per day.');
      error.status = 400;
      throw error;
    }
  }

  // Check duplicate slot if date or slot changed
  if (cleanData.date !== existing.reading_date || cleanData.slot !== existing.slot) {
    const duplicateRes = await db.query(
      'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND slot = $3 AND id != $4',
      [userId, cleanData.date, cleanData.slot, id]
    );
    if (duplicateRes.rows.length > 0) {
      const error = new Error(getDuplicateSlotMessage(cleanData.slot));
      error.status = 400;
      throw error;
    }
  }

  // Update
  const updateRes = await db.query(
    `UPDATE readings
     SET reading_date = $1, slot = $2, glucose_value = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $4 AND user_id = $5
     RETURNING id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, glucose_value, created_at, updated_at`,
    [cleanData.date, cleanData.slot, cleanData.value, id, userId]
  );

  // Invalidate Redis reports cache on update
  await invalidateUserReports(userId);

  return updateRes.rows[0];
}

/**
 * Deletes a reading
 */
async function deleteReading({ userId, id }) {
  // Ensure exists and belongs to user
  await getReadingById({ userId, id });

  await db.query(
    'DELETE FROM readings WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  // Invalidate Redis reports cache on delete
  await invalidateUserReports(userId);

  return { message: 'Reading deleted successfully.' };
}

module.exports = {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading,
};
