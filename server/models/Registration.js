const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  phone: { type: String },
  year: { type: String },
  branch: { type: String },
  isCheckedIn: { type: Boolean, default: false },
  checkedInAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);
