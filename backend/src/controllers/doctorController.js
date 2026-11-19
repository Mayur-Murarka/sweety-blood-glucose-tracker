const db = require('../config/db');
const reportService = require('../services/reportService');

/**
 * Lists all patients assigned to the authenticated doctor
 */
async function getAssignedPatients(req, res, next) {
  try {
    const doctorId = req.user.id;
    const todayStr = new Date().toISOString().slice(0, 10);

    const patientsRes = await db.query(
      `SELECT u.id, u.name, u.email, dp.created_at AS assigned_at,
         COUNT(r.id)::int AS total_readings,
         COUNT(CASE WHEN r.reading_date = $1 THEN 1 END)::int AS today_readings,
         TO_CHAR(MAX(r.reading_date), 'YYYY-MM-DD') AS latest_reading_date
       FROM doctor_patients dp
       JOIN users u ON u.id = dp.patient_id
       LEFT JOIN readings r ON r.user_id = u.id
       WHERE dp.doctor_id = $2
       GROUP BY u.id, u.name, u.email, dp.created_at
       ORDER BY u.name ASC`,
      [todayStr, doctorId]
    );

    res.status(200).json({ patients: patientsRes.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Gets a specific assigned patient's clinical reports
 */
async function getPatientReports(req, res, next) {
  try {
    const doctorId = req.user.id;
    const patientId = parseInt(req.params.patientId, 10);
    const { date } = req.query;

    // Verify patient is assigned to this doctor
    const verifyRes = await db.query(
      'SELECT id FROM doctor_patients WHERE doctor_id = $1 AND patient_id = $2',
      [doctorId, patientId]
    );

    if (verifyRes.rows.length === 0) {
      return res.status(403).json({
        error: 'Access denied. This patient is not assigned to your clinical account.',
      });
    }

    // Fetch patient info
    const patientInfoRes = await db.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [patientId]
    );
    const patient = patientInfoRes.rows[0];

    // Compute patient's reports
    const reports = await reportService.getReports({
      userId: patientId,
      selectedDate: date,
    });

    res.status(200).json({
      patient,
      ...reports,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Assigns a patient to this doctor by patient email
 */
async function assignPatient(req, res, next) {
  try {
    const doctorId = req.user.id;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Please provide the patient email.' });
    }

    const patientRes = await db.query(
      'SELECT id, name, email, role FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (patientRes.rows.length === 0) {
      return res.status(404).json({ error: 'No patient found with that email address.' });
    }

    const patient = patientRes.rows[0];
    if (patient.role === 'doctor') {
      return res.status(400).json({ error: 'Cannot assign another doctor account as a patient.' });
    }

    await db.query(
      `INSERT INTO doctor_patients (doctor_id, patient_id)
       VALUES ($1, $2)
       ON CONFLICT (doctor_id, patient_id) DO NOTHING`,
      [doctorId, patient.id]
    );

    res.status(201).json({
      message: `Patient ${patient.name} (${patient.email}) assigned successfully.`,
      patient: { id: patient.id, name: patient.name, email: patient.email },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAssignedPatients,
  getPatientReports,
  assignPatient,
};
