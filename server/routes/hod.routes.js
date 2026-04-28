const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const HOD = require('../models/HOD');

const router = express.Router();

// Register a new HOD
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    const existingHOD = await HOD.findOne({ email });

    if (existingHOD) {
      return res.status(400).json({ message: 'HOD already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const hod = new HOD({
      name,
      email,
      department,
      password: hashedPassword
    });

    await hod.save();

    res.status(201).json({ message: 'HOD Registration successful. You can now log in.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during HOD registration' });
  }
});

// Login HOD
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const hod = await HOD.findOne({ email });

    if (!hod) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, hod.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: hod._id,
        role: 'hod',
        department: hod.department
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
            id: hod._id,
            name: hod.name,
            email: hod.email,
            department: hod.department,
            role: 'hod'
          }
        });
      }
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during HOD login' });
  }
});

module.exports = router;

