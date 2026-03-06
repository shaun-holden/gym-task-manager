const cron = require('node-cron');
const prisma = require('../utils/prisma');
const sendEmail = require('../utils/sendEmail');
const { createNotification } = require('../utils/notify');

function startEodReminder(io) {
  const [hour, minute] = (process.env.EOD_REMINDER_TIME || '17:00').split(':');
  const cronExpression = `${minute} ${hour} * * 1-5`; // weekdays only

  cron.schedule(cronExpression, async () => {
    console.log('Running EOD reminder check...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const templates = await prisma.eodTemplate.findMany({ where: { isActive: true } });
      const employees = await prisma.user.findMany({
        where: { role: 'EMPLOYEE' },
        select: { id: true, name: true, email: true, supervisorId: true, organizationId: true },
      });

      // Track missing EODs per supervisor
      const supervisorMissing = {};

      for (const employee of employees) {
        for (const template of templates) {
          // Only check templates in the employee's org (or templates with no org)
          if (template.organizationId && template.organizationId !== employee.organizationId) continue;

          const existing = await prisma.eodSubmission.findFirst({
            where: { employeeId: employee.id, templateId: template.id, date: today },
          });

          if (!existing) {
            await sendEmail({
              to: employee.email,
              subject: 'Reminder: Please submit your EOD report',
              html: `<p>Hi ${employee.name},</p>
                     <p>This is a reminder to complete your End of Day report: <strong>${template.title}</strong></p>
                     <p>Please log in to GymTaskManager and submit it before you leave.</p>`,
            });

            await createNotification(io, {
              userId: employee.id,
              type: 'EOD_REMINDER',
              message: `Reminder: Please submit your EOD report "${template.title}"`,
              relatedId: template.id,
            });

            // Track for supervisor notification
            if (employee.supervisorId) {
              if (!supervisorMissing[employee.supervisorId]) {
                supervisorMissing[employee.supervisorId] = [];
              }
              supervisorMissing[employee.supervisorId].push(employee.name);
            }
          }
        }
      }

      // Notify supervisors about employees with missing EODs
      for (const [supId, names] of Object.entries(supervisorMissing)) {
        const uniqueNames = [...new Set(names)];
        await createNotification(io, {
          userId: supId,
          type: 'EOD_REMINDER',
          message: `EOD not submitted by: ${uniqueNames.join(', ')}`,
        });
      }

      console.log('EOD reminder check complete.');
    } catch (err) {
      console.error('EOD reminder error:', err);
    }
  });

  console.log(`EOD reminder scheduled at ${hour}:${minute} on weekdays`);
}

module.exports = startEodReminder;
