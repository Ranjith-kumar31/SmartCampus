const emailjs = require('@emailjs/nodejs');

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

module.exports = { sendEmail };
