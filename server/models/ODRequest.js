const mongoose = require('mongoose');

const odRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  reason: { type: String, required: true },
  hodRemarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ODRequest', odRequestSchema);
