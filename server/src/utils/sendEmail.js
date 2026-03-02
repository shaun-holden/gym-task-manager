const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[Email] SMTP not configured, skipping email to:', to);
    console.log('[Email] Subject:', subject);
    return null;
  }

  return transporter.sendMail({
    from: process.env.SMTP_FROM || '"GymTaskManager" <noreply@gym.com>',
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;
