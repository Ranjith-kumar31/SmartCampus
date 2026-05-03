const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const ResetToken = require('../models/ResetToken');
const { sendEmail } = require('../utils/email');
const Student = require('../models/Student');
const HOD = require('../models/HOD');
const Club = require('../models/Club');
const Admin = require('../models/Admin');

// Helper to find user across all models
const findUserByEmail = async (email) => {
  const models = [Student, HOD, Club, Admin];
  for (const Model of models) {
    const user = await Model.findOne({ email });
    if (user) return { user, model: Model };
  }
  return null;
};

// 1. Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const userResult = await findUserByEmail(email);

    if (!userResult) {
      // Security: Don't reveal if email exists, but we'll stop here internally
      return res.status(200).json({ message: "If an account exists with this email, a password reset link has been sent." });
    }

    // Generate 64-character token
    const token = crypto.randomBytes(32).toString('hex');

    // Save token to DB
    await ResetToken.deleteMany({ email }); // Clear old ones
    await new ResetToken({ email, token, expiresAt: new Date(Date.now() + 15 * 60 * 1000) }).save();

    // Reset Link (Assuming frontend runs on localhost:5173 or relative path if same domain)
    // The exact host can be an environment variable, but we'll use a relative or hardcoded fallback.
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    // Send Email using EmailJS
    await sendEmail({
      to_name: userResult.user.name || 'User',
      to_email: email,
      message: `You requested to reset your password. Please click on the following link to reset your password:\n\n${resetLink}\n\nThis link is valid for 15 minutes. If you didn't request this, please ignore this email.`
    });

    res.status(200).json({ message: "Password reset link sent successfully!" });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Failed to send reset link. Please try again later." });
  }
});

// 2. Verify Token (Optional, can be used to validate link before showing reset form)
router.get('/verify-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const record = await ResetToken.findOne({ token });

    if (!record) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    res.status(200).json({ message: "Token is valid." });
  } catch (error) {
    res.status(500).json({ message: "Verification failed." });
  }
});

// 3. Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify Token
    const record = await ResetToken.findOne({ token });
    if (!record) {
      return res.status(400).json({ message: "Invalid or expired reset link." });
    }

    const email = record.email;
    const userResult = await findUserByEmail(email);
    if (!userResult) {
      return res.status(404).json({ message: "User not found." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    userResult.user.password = hashedPassword;
    await userResult.user.save();

    // Delete Token
    await ResetToken.deleteMany({ email });

    res.status(200).json({ message: "Password reset successful! You can now login." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Failed to reset password." });
  }
});

module.exports = router;
