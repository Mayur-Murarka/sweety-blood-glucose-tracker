const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// All doctor routes require valid authentication and the 'doctor' role
router.use(authenticateToken);
router.use(requireRole('doctor'));

router.get('/patients', doctorController.getAssignedPatients);
router.get('/patients/:patientId/reports', doctorController.getPatientReports);
router.post('/assign', doctorController.assignPatient);

module.exports = router;
