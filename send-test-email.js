require('dotenv').config();
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email options
const mailOptions = {
  from: process.env.EMAIL_USER,
  to: 'yourtestemail@example.com', // change to your own email
  subject: 'Nodemailer Test',
  text: 'This is a test email from Nodemailer with Gmail SMTP.'
};

// Send email
transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    console.error('Error sending email:', err);
  } else {
    console.log('Email sent:', info.response);
  }
});
