const reportService = require('../services/reportService');

async function getReports(req, res, next) {
  try {
    const { date } = req.query;
    const reports = await reportService.getReports({
      userId: req.user.id,
      selectedDate: date,
    });
    res.status(200).json(reports);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getReports,
};
