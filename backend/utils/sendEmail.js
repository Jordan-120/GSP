let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  nodemailer = null;
}

async function sendWithSes({ to, subject, html }) {
  const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

  const ses = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const command = new SendEmailCommand({
    Source: process.env.AWS_FROM_EMAIL,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
      },
      Body: {
        Html: {
          Data: html,
        },
      },
    },
  });

  return ses.send(command);
}

async function sendWithSmtp({ to, subject, html }) {
  if (!nodemailer) {
    throw new Error('nodemailer is not installed.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter.sendMail({
    from: process.env.SMTP_FROM || `"Guide Sheet Pro" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

async function sendEmail({ to, subject, html }) {
  const hasSesEnv =
    process.env.AWS_REGION &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_FROM_EMAIL;

  if (hasSesEnv) {
    try {
      return await sendWithSes({ to, subject, html });
    } catch (error) {
      console.error('SES email send failed, falling back to SMTP:', error.message);
    }
  }

  return sendWithSmtp({ to, subject, html });
}

module.exports = sendEmail;
