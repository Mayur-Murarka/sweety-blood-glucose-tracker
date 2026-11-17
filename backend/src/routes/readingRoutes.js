const express = require('express');
const router = express.Router();
const readingController = require('../controllers/readingController');
const { authenticateToken } = require('../middleware/auth');

// All reading routes are protected by authentication
router.use(authenticateToken);

router.post('/', readingController.createReading);
router.get('/', readingController.getReadings);
router.get('/:id', readingController.getReadingById);
router.put('/:id', readingController.updateReading);
router.delete('/:id', readingController.deleteReading);

module.exports = router;
