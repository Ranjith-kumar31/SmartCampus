const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const OTP = require('../models/OTP');
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
      return res.status(200).json({ message: "If an account exists with this email, an OTP has been sent." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to DB
    await OTP.deleteMany({ email }); // Clear old ones
    await new OTP({ email, otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }).save();

    // Send Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const mailOptions = {
      from: `"Smart Campus" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP - Smart Campus",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4F46E5; text-align: center;">Smart Campus</h2>
          <p>Hello,</p>
          <p>You requested to reset your password. Use the following OTP to proceed. This code is valid for 10 minutes.</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827; border-radius: 8px;">
            ${otp}
          </div>
          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent successfully!" });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again later." });
  }
});

// 2. Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await OTP.findOne({ email, otp });

    if (!record) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    res.status(200).json({ message: "OTP verified successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Verification failed." });
  }
});

// 3. Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Verify OTP one last time
    const record = await OTP.findOne({ email, otp });
    if (!record) {
      return res.status(400).json({ message: "Invalid or expired OTP session." });
    }

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

    // Delete OTP
    await OTP.deleteMany({ email });

    res.status(200).json({ message: "Password reset successful! You can now login." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Failed to reset password." });
  }
});

module.exports = router;
