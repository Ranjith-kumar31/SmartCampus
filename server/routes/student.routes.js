const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// Register a new student
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department, rollNumber } = req.body;

    // Check if student exists
    const existingStudent = await Student.findOne({ $or: [{ email }, { rollNumber }] });

    if (existingStudent) {
      if (existingStudent.email === email) {
        return res.status(400).json({ message: 'Student with this email already exists' });
      }
      return res.status(400).json({ message: 'Roll number already in use' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const student = new Student({
      name,
      email,
      department,
      rollNumber,
      password: hashedPassword
    });

    await student.save();

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
    const student = await Student.findOne({ email });

    if (!student) {
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
        id: student._id,
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
            id: student._id,
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

