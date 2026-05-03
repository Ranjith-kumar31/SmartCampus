const mongoose = require('mongoose');

const resetTokenSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: '15m' } } // Auto-delete after 15 mins
}, { timestamps: true });

module.exports = mongoose.model('ResetToken', resetTokenSchema);
