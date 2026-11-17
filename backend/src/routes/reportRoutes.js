const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

// All report routes are protected by authentication
router.use(authenticateToken);

router.get('/', reportController.getReports);

module.exports = router;
