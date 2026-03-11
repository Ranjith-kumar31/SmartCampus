const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// Register a new student
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department, rollNumber } = req.body;

    // Check if student exists
    const { data: existingEmail } = await supabase
      .from('students')
      .select('email')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return res.status(400).json({ message: 'Student already exists' });
    }

    // Check if roll number exists
    const { data: existingRoll } = await supabase
      .from('students')
      .select('roll_number')
      .eq('roll_number', rollNumber)
      .single();

    if (existingRoll) {
      return res.status(400).json({ message: 'Roll number already in use' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: student, error } = await supabase
      .from('students')
      .insert([
        {
          name,
          email,
          department,
          roll_number: rollNumber,
          password: hashedPassword
        }
      ])
      .select('id, name, email, department, rollNumber:roll_number')
      .single();

    if (error) throw error;

    // Send Welcome Email async
    sendEmail({
      to_name: name,
      to_email: email,
      message: `Welcome to SmartCampus! Your account has been registered under the ${department} department.`,
    }).catch(err => console.error("Failed to send welcome email:", err));

    res.status(201).json({ message: 'Registration successful. You can now log in.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login student
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Filter by email
    const { data: student, error } = await supabase
      .from('students')
      .select('id, name, email, password, department, rollNumber:roll_number')
      .eq('email', email)
      .single();

    if (error || !student) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Assign Token
    const payload = {
      student: {
        id: student.id,
        role: 'student',
        department: student.department
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: student.id,
            name: student.name,
            email: student.email,
            department: student.department,
            rollNumber: student.rollNumber,
            role: 'student'
          }
        });
      }
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
