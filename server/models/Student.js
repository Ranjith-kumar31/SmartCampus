const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String, required: true, enum: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML'] },
  rollNumber: { type: String, required: true, unique: true },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
