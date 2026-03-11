const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const supabase = require('../utils/supabase');

const router = express.Router();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order for event registration fee
 * Body: { eventId, studentId }
 */
router.post('/create-order', async (req, res) => {
  try {
    const { eventId, studentId } = req.body;

    const { data: event, error } = await supabase
      .from('events')
      .select('title, reg_fee')
      .eq('id', eventId)
      .single();

    if (error || !event) return res.status(404).json({ message: 'Event not found' });

    if (!event.reg_fee || event.reg_fee === 0) {
      return res.status(400).json({ message: 'This event is free — no payment needed.' });
    }

    const options = {
      amount: event.reg_fee * 100, // Razorpay expects amount in paise (1 INR = 100 paise)
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
 * Verifies Razorpay payment signature and registers the student for the event
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, eventId, studentId }
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

    // Signature verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed — invalid signature.' });
    }

    // Payment verified — register student for event
    // Check if already registered
    const { data: existingReg } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('student_id', studentId)
      .single();

    if (existingReg) {
      return res.status(400).json({ message: 'Already registered for this event.' });
    }

    // Register student
    const { error: regError } = await supabase
      .from('event_registrations')
      .insert([{ event_id: eventId, student_id: studentId }]);

    if (regError) throw regError;

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
 * Returns the Razorpay key_id to the frontend (safe to expose)
 */
router.get('/key', (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

module.exports = router;
