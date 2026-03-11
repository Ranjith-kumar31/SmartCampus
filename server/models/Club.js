const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  coordinator: { type: String, required: true },
  department: { type: String, required: true },
  proofFile: { type: String, default: null },   // stored filename of uploaded proof
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Club', clubSchema);
