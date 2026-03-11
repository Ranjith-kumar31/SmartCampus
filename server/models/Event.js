const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  domain: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  expectedAudience: { type: Number, required: true },
  regFee: { type: Number, default: 0 },
  description: { type: String, required: true },
  rules: { type: [String], default: [] },
  prizes: { type: [String], default: [] },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  registeredStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
