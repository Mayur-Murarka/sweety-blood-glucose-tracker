const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.register({ name, email, password, role });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    res.status(200).json({ user: req.user });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getProfile,
};
