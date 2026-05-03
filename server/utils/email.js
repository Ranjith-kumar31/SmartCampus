const emailjs = require('@emailjs/nodejs');
const nodemailer = require('nodemailer');
/**
 * Sends an email using EmailJS Node.js SDK
 * @param {Object} templateParams - The parameters required for your specific EmailJS template
 * @param {string} templateParams.to_name - Name of receiver
 * @param {string} templateParams.to_email - Email address of receiver 
 * @param {string} templateParams.message - Email content
 */
const sendEmail = async (templateParams) => {
  try {
    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );
    
    console.log('Email sent successfully!', response.status, response.text);
    return true;
  } catch (error) {
    console.error('EmailJS sending failed:', error);
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
