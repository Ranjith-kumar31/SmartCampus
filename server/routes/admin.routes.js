const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');

const router = express.Router();

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: admin.id,
        role: 'admin',
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: 'admin',
          }
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

module.exports = router;
