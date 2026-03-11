const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded proof files statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Default route
app.get('/', (req, res) => {
  res.send('SmartCampus API is running...');
});

// Routes
const studentRoutes = require('./routes/student.routes');
const clubRoutes = require('./routes/club.routes');
const eventRoutes = require('./routes/event.routes');
const odRoutes = require('./routes/od.routes');
const hodRoutes = require('./routes/hod.routes');
const adminRoutes = require('./routes/admin.routes');
const aiRoutes = require('./routes/ai.routes');
const paymentRoutes = require('./routes/payment.routes');
const chatbotRoutes = require('./routes/chatbot.routes');

app.use('/api/students', studentRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/od', odRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Direct chat endpoint
app.post("/api/chat", async (req, res) => {
  const message = req.body.message;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await chatbotRoutes.generateResponse(message.trim());
    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      type: 'text',
      message: "⚠️ Oops! I ran into an issue. Please try again in a moment.",
      intent: 'error'
    });
  }
});

// EmailJS Test Route
const { sendEmail } = require('./utils/email');
app.post('/api/test-email', async (req, res) => {
  const { to_email, to_name, message } = req.body;

  if (!to_email) return res.status(400).json({ error: 'to_email is required' });

  const success = await sendEmail({
    to_name: to_name || 'Student',
    to_email: to_email,
    message: message || 'Welcome to SmartCampus! Your account has been registered.',
  });

  if (success) {
    res.json({ message: 'Email sent successfully via EmailJS!' });
  } else {
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
