const express = require('express');
const router = express.Router();
const { triggerDailyReminder } = require('../queue/reminderQueue');
const { authenticateToken } = require('../middleware/auth');

// Protected endpoint to trigger/test daily reminder job
router.post(['/trigger', '/check'], authenticateToken, async (req, res, next) => {
  try {
    const { date } = req.body;
    const result = await triggerDailyReminder(date);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
