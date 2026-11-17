const db = require('../config/db');
const { isValidDateFormat } = require('../utils/validation');

/**
 * Calculates date ranges for Daily, Month-to-date, and Monthly (previous month)
 */
function calculateReportRanges(selectedDateStr) {
  const [yearStr, monthStr, dayStr] = selectedDateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  const day = parseInt(dayStr, 10);

  // 1. Daily: selectedDate
  const dailyRange = {
    type: 'Daily',
    startDate: selectedDateStr,
    endDate: selectedDateStr,
    label: selectedDateStr,
  };

  // 2. Month-to-date: 1st of current month to selectedDate
  const mtdStart = `${yearStr}-${monthStr}-01`;
  const mtdRange = {
    type: 'Month-to-date',
    startDate: mtdStart,
    endDate: selectedDateStr,
    label: `${mtdStart} to ${selectedDateStr}`,
  };

  // 3. Monthly: The whole previous month
  // E.g., if selectedDate is in Oct 2026 -> 1 Sep 2026 to 30 Sep 2026
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  const prevMonthStr = String(prevMonth).padStart(2, '0');
  const prevYearStr = String(prevYear);
  // Last day of previous month
  const lastDayOfPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
  const prevMonthStart = `${prevYearStr}-${prevMonthStr}-01`;
  const prevMonthEnd = `${prevYearStr}-${prevMonthStr}-${String(lastDayOfPrevMonth).padStart(2, '0')}`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const prevMonthLabel = `${monthNames[prevMonth - 1]} ${prevYearStr}`;

  const monthlyRange = {
    type: 'Monthly',
    startDate: prevMonthStart,
    endDate: prevMonthEnd,
    label: `${prevMonthStart} to ${prevMonthEnd}`,
    monthName: prevMonthLabel,
  };

  return { dailyRange, mtdRange, monthlyRange };
}

/**
 * Computes statistics for a date range
 */
async function computeRangeStats(userId, startDate, endDate) {
  const statsRes = await db.query(
    `SELECT
       COUNT(*)::int AS count,
       MAX(glucose_value)::int AS highest,
       MIN(glucose_value)::int AS lowest,
       ROUND(AVG(glucose_value)::numeric, 1)::float AS average
     FROM readings
     WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3`,
    [userId, startDate, endDate]
  );

  const row = statsRes.rows[0];
  const count = parseInt(row.count, 10) || 0;

  if (count === 0) {
    return {
      count: 0,
      highest: null,
      lowest: null,
      average: null,
      hasReadings: false,
    };
  }

  return {
    count,
    highest: row.highest,
    lowest: row.lowest,
    average: row.average !== null ? Number(row.average) : null,
    hasReadings: true,
  };
}

/**
 * Retrieves daily, month-to-date, and previous month reports for a given date
 */
async function getReports({ userId, selectedDate }) {
  let targetDate = selectedDate;

  // Default to today's date if not passed
  if (!targetDate) {
    const today = new Date();
    targetDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
  }

  if (!isValidDateFormat(targetDate)) {
    const error = new Error('Please provide a valid date in YYYY-MM-DD format.');
    error.status = 400;
    throw error;
  }

  const { dailyRange, mtdRange, monthlyRange } = calculateReportRanges(targetDate);

  // Compute stats in parallel
  const [dailyStats, mtdStats, monthlyStats, dailyReadingsRes, mtdReadingsRes] = await Promise.all([
    computeRangeStats(userId, dailyRange.startDate, dailyRange.endDate),
    computeRangeStats(userId, mtdRange.startDate, mtdRange.endDate),
    computeRangeStats(userId, monthlyRange.startDate, monthlyRange.endDate),
    // Daily readings with slots
    db.query(
      `SELECT id, user_id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, glucose_value, created_at, updated_at
       FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY
         CASE slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC,
         id ASC`,
      [userId, dailyRange.startDate]
    ),
    // Month-to-date readings for line chart
    db.query(
      `SELECT id, TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date, slot, glucose_value
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
       ORDER BY reading_date ASC,
         CASE slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC`,
      [userId, mtdRange.startDate, mtdRange.endDate]
    ),
  ]);

  return {
    selectedDate: targetDate,
    daily: {
      ...dailyRange,
      ...dailyStats,
      readings: dailyReadingsRes.rows,
    },
    monthToDate: {
      ...mtdRange,
      ...mtdStats,
    },
    monthly: {
      ...monthlyRange,
      ...monthlyStats,
    },
    chartReadings: mtdReadingsRes.rows,
  };
}

module.exports = {
  calculateReportRanges,
  computeRangeStats,
  getReports,
};
