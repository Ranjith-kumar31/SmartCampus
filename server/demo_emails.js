require('dotenv').config();
const { sendWelcomeEmail, sendEmail } = require('./utils/email');

async function runDemo() {
  const targetEmail = process.env.GMAIL_USER || 'adminsmartcampus@gmail.com';
  
  console.log(`Sending demo emails to: ${targetEmail}...\n`);

  // 1. Send Welcome Email (Nodemailer)
  console.log('1. Sending Registration Successful Email...');
  const welcomeSuccess = await sendWelcomeEmail(targetEmail, 'Admin User');
  if (welcomeSuccess) {
    console.log('✅ Registration Email sent successfully!\n');
  } else {
    console.log('❌ Failed to send Registration Email.\n');
  }

  // 2. Send Forgot Password Email (EmailJS)
  console.log('2. Sending Forgot Password Email (via EmailJS)...');
  const dummyToken = 'abc123demo456token789';
  const resetLink = `http://localhost:5173/reset-password?token=${dummyToken}`;
  const message = `You requested to reset your password. Please click on the following link to reset your password:\n\n${resetLink}\n\nThis link is valid for 15 minutes. If you didn't request this, please ignore this email.`;
  
  const forgotSuccess = await sendEmail({
    to_name: 'Admin User',
    to_email: targetEmail,
    message: message
  });
  
  if (forgotSuccess) {
    console.log('✅ Forgot Password Email sent successfully via EmailJS!\n');
  } else {
    console.log('❌ Failed to send Forgot Password Email via EmailJS.\n');
  }

  console.log('Demo completed. Check your inbox!');
}

runDemo();
