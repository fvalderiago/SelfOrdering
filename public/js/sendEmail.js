const nodemailer = require('nodemailer');

async function sendEmail({ to, subject, text }) {
  // Create transporter with SMTP config
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',       // replace with SMTP server
    port: 587,                      // or 465 for secure
    secure: false,                  // true if port 465
    auth: {
      user: 'currysteps1403@gmail.com',  // SMTP username
      pass: 'hwcp meiz hyyt jmod',     // SMTP password
    },
  });

  // Send mail
  await transporter.sendMail({
    from: '"Curry Steps" <no-reply@gmail.com>',
    to,
    subject,
    text,
  });
}

module.exports = sendEmail;
