const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

/**
 * Sends a generic email using Nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to_name - Name of receiver
 * @param {string} options.to_email - Email address of receiver 
 * @param {string} options.message - Email content
 */
const sendEmail = async ({ to_name, to_email, message }) => {
  try {
    const mailOptions = {
      from: `"Smart Campus" <${process.env.GMAIL_USER}>`,
      to: to_email,
      subject: "Smart Campus - Important Notification",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4F46E5; text-align: center;">Smart Campus Notification</h2>
          <p>Dear ${to_name},</p>
          <p style="white-space: pre-wrap;">${message}</p>
          <br/>
          <p>Best Regards,</p>
          <p><strong>Smart Campus Team</strong></p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

/**
 * Sends a welcome email using Nodemailer
 * @param {string} email - Email address of receiver 
 * @param {string} name - Name of receiver
 */
const sendWelcomeEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: `"Smart Campus" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Welcome to Smart Campus!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4F46E5; text-align: center;">Welcome to our platform! 🎉</h2>
          <p>Dear ${name},</p>
          <p>Your registration has been completed successfully.</p>
          <p>We’re excited to have you with us. You can now log in and start using our services.</p>
          <p>If you have any questions, feel free to contact our support team.</p>
          <br/>
          <p>Best Regards,</p>
          <p><strong>Team Support</strong></p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully!', info.messageId);
    return true;
  } catch (error) {
    console.error('Welcome email sending failed:', error);
    return false;
  }
};

module.exports = { sendEmail, sendWelcomeEmail };
