const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

const bcrypt = require('bcryptjs');
const pool = require('./db');


router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).send('Missing token or new password');
    }

    // Hash the received token to match DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user by reset token and check expiry
    const [rows] = await pool.execute(
      'SELECT userId FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW() LIMIT 1',
      [hashedToken]
    );

    if (rows.length === 0) {
      return res.status(400).send('Invalid or expired token');
    }

    const userId = rows[0].id;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token + expiry
    await pool.execute(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE userId = ?',
      [hashedPassword, userId]
    );

    res.send('Password has been reset successfully');
  } catch (error) {
    console.error('Error in reset-password:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;


router.post('/send-reset-email', async (req, res) => {
  try {
    const { username } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user) {
      // Respond with generic success message
      return res.status(200).send('If that user exists, an email has been sent.');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token to store in DB securely
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save token and expiry (1 hour from now)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    // Compose reset URL (adjust domain)
    const resetUrl = `https://yourdomain.com/reset-password?token=${resetToken}`;

    // Send email
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `Hello ${user.username},\n\nPlease reset your password by clicking the link below:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n`,
    });

    res.status(200).send('If that user exists, an email has been sent.');
  } catch (error) {
    console.error('Error sending reset email:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
