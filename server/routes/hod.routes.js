const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');

const router = express.Router();

// Register a new HOD
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    const { data: existingHOD } = await supabase
      .from('hods')
      .select('email')
      .eq('email', email)
      .single();

    if (existingHOD) {
      return res.status(400).json({ message: 'HOD already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: hod, error } = await supabase
      .from('hods')
      .insert([
        {
          name,
          email,
          department,
          password: hashedPassword
        }
      ])
      .select()
      .single();

    if (error) throw error;

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

    const { data: hod, error } = await supabase
      .from('hods')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !hod) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, hod.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: hod.id,
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
            id: hod.id,
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
