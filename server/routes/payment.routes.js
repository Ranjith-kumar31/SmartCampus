const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

const router = express.Router();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * POST /api/payments/create-order
 */
router.post('/create-order', async (req, res) => {
  try {
    const { eventId, studentId } = req.body;

    const event = await Event.findById(eventId);

    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (!event.regFee || event.regFee === 0) {
      return res.status(400).json({ message: 'This event is free — no payment needed.' });
    }

    const options = {
      amount: event.regFee * 100,
      currency: 'INR',
      receipt: `receipt_${eventId.substring(0, 8)}_${studentId.substring(0, 8)}_${Date.now()}`,
      notes: {
        eventId,
        studentId,
        eventTitle: event.title,
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      eventTitle: event.title,
      eventId,
      studentId,
    });
  } catch (error) {
    console.error('Razorpay create-order error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
});

/**
 * POST /api/payments/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      eventId,
      studentId,
    } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed — invalid signature.' });
    }

    const existingReg = await Registration.findOne({ event: eventId, student: studentId });

    if (existingReg) {
      return res.status(400).json({ message: 'Already registered for this event.' });
    }

    const registration = new Registration({
        event: eventId,
        student: studentId,
    });

    await registration.save();
    
    // Also update Event array
    await Event.findByIdAndUpdate(eventId, { $addToSet: { registeredStudents: studentId } });

    res.json({
      message: 'Payment verified and registration successful!',
      paymentId: razorpay_payment_id,
      eventId,
    });
  } catch (error) {
    console.error('Razorpay verify error:', error);
    res.status(500).json({ message: 'Payment verification error' });
  }
});

/**
 * GET /api/payments/key
 */
router.get('/key', (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

module.exports = router;

