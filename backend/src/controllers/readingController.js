const readingService = require('../services/readingService');

async function createReading(req, res, next) {
  try {
    const { date, slot, value } = req.body;
    const reading = await readingService.createReading({
      userId: req.user.id,
      date,
      slot,
      value,
    });
    res.status(201).json(reading);
  } catch (err) {
    next(err);
  }
}

async function getReadings(req, res, next) {
  try {
    const { page, limit, date, month } = req.query;
    const result = await readingService.getReadings({
      userId: req.user.id,
      page,
      limit,
      date,
      month,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getReadingById(req, res, next) {
  try {
    const { id } = req.params;
    const reading = await readingService.getReadingById({
      userId: req.user.id,
      id: parseInt(id, 10),
    });
    res.status(200).json(reading);
  } catch (err) {
    next(err);
  }
}

async function updateReading(req, res, next) {
  try {
    const { id } = req.params;
    const { date, slot, value } = req.body;
    const reading = await readingService.updateReading({
      userId: req.user.id,
      id: parseInt(id, 10),
      date,
      slot,
      value,
    });
    res.status(200).json(reading);
  } catch (err) {
    next(err);
  }
}

async function deleteReading(req, res, next) {
  try {
    const { id } = req.params;
    const result = await readingService.deleteReading({
      userId: req.user.id,
      id: parseInt(id, 10),
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading,
};
