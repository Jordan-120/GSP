const nodemailer = require('nodemailer');

async function sendEmail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,      // e.g. "smtp.gmail.com" or Mailtrap host
    port: process.env.SMTP_PORT,      // 465 or 587, etc.
    secure: false,                    // true for 465, false for others
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Your App Name" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;
