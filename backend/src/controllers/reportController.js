const reportService = require('../services/reportService');
const { getCachedReports, setCachedReports } = require('../config/redis');

async function getReports(req, res, next) {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().slice(0, 10);

    // 1. Check Redis Cache
    const cached = await getCachedReports(req.user.id, targetDate);
    if (cached) {
      return res.status(200).json({ ...cached, fromCache: true });
    }

    // 2. Compute Reports
    const reports = await reportService.getReports({
      userId: req.user.id,
      selectedDate: date,
    });

    // 3. Store in Redis Cache with 5-minute TTL (300 seconds)
    await setCachedReports(req.user.id, reports.selectedDate, reports, 300);

    res.status(200).json({ ...reports, fromCache: false });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getReports,
};
