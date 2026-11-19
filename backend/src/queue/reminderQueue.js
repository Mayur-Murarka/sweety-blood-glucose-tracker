const { Queue, Worker } = require('bullmq');
const { initRedis } = require('../config/redis');
const db = require('../config/db');

let reminderQueue = null;
let reminderWorker = null;

async function processDailyReminders(targetDate) {
  const dateStr = targetDate || new Date().toISOString().slice(0, 10);
  console.log(`[BullMQ Worker] Running daily compliance check for date: ${dateStr}...`);

  // Query all patients and count their readings for today
  const patientsRes = await db.query(
    `SELECT u.id, u.name, u.email,
       COUNT(r.id)::int AS today_readings_count
     FROM users u
     LEFT JOIN readings r ON r.user_id = u.id AND r.reading_date = $1
     WHERE u.role = 'patient'
     GROUP BY u.id, u.name, u.email`,
    [dateStr]
  );

  const remindersSent = [];

  for (const patient of patientsRes.rows) {
    const count = parseInt(patient.today_readings_count, 10);
    if (count < 4) {
      const msg = `[Daily Reminder Alert] Patient ${patient.name} (${patient.email}) has recorded only ${count}/4 readings for ${dateStr}. Prompting compliance log reminder.`;
      console.log(msg);
      remindersSent.push({
        patientId: patient.id,
        name: patient.name,
        email: patient.email,
        readingsCount: count,
        message: msg,
      });
    }
  }

  return {
    date: dateStr,
    totalPatientsEvaluated: patientsRes.rows.length,
    remindersCount: remindersSent.length,
    reminders: remindersSent,
  };
}

function initReminderQueue() {
  const redisClient = initRedis();

  try {
    // If running in real redis or mock
    reminderQueue = new Queue('daily-reminder-queue', {
      connection: redisClient,
    });

    reminderWorker = new Worker(
      'daily-reminder-queue',
      async (job) => {
        console.log(`[BullMQ Worker] Processing job ${job.id} (${job.name})`);
        return await processDailyReminders(job.data?.date);
      },
      { connection: redisClient }
    );

    reminderWorker.on('completed', (job, result) => {
      console.log(`[BullMQ Worker] Job ${job.id} completed. Evaluated ${result.totalPatientsEvaluated} patients, generated ${result.remindersCount} reminder(s).`);
    });

    reminderWorker.on('error', (err) => {
      console.warn('[BullMQ Worker] Worker warning:', err.message);
    });

    console.log('[BullMQ] Daily reminder queue and worker initialized.');
  } catch (err) {
    console.warn('[BullMQ] Queue initialization fallback:', err.message);
  }

  return { reminderQueue, reminderWorker };
}

async function triggerDailyReminder(targetDate) {
  // If queue is active, dispatch job
  if (reminderQueue && reminderQueue.add) {
    try {
      const job = await reminderQueue.add('daily-compliance-check', { date: targetDate });
      return {
        jobId: job.id,
        status: 'queued',
        message: 'Reminder job queued via BullMQ',
      };
    } catch (queueErr) {
      console.warn('[BullMQ] Queue add failed, running synchronously:', queueErr.message);
    }
  }

  // Synchronous fallback
  const result = await processDailyReminders(targetDate);
  return {
    status: 'completed',
    result,
  };
}

module.exports = {
  initReminderQueue,
  processDailyReminders,
  triggerDailyReminder,
};
