const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Club = require('../models/Club');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// --- Multer Config ---
const uploadDir = path.join(__dirname, '../uploads/proofs');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only PDF, JPG, JPEG, PNG files are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

// Register a new club (Pending Approval)
router.post('/register', upload.single('proofFile'), async (req, res) => {
  try {
    const { name, email, password, coordinator, department } = req.body;

    // Check if club exists
    const existingClub = await Club.findOne({ $or: [{ email }, { name }] });

    if (existingClub) {
      if (existingClub.email === email) {
        return res.status(400).json({ message: 'A club with this email already exists' });
      }
      return res.status(400).json({ message: 'A club with this name already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const club = new Club({
      name,
      email,
      coordinator,
      department,
      password: hashedPassword,
      proofFile: req.file ? req.file.filename : null,
      status: 'Pending'
    });

    await club.save();

    res.status(201).json({ message: 'Club registration submitted. Waiting for Admin approval.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error during club registration' });
  }
});


// Login club
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Filter by email
    const club = await Club.findOne({ email });

    if (!club) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, club.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if approved by Admin
    if (club.status !== 'Approved') {
      return res.status(403).json({ message: `Your club status is: ${club.status}. Access denied.` });
    }

    // Assign Token
    const payload = {
      club: {
        id: club._id,
        role: 'club',
        department: club.department
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
            id: club._id,
            name: club.name,
            email: club.email,
            coordinator: club.coordinator,
            department: club.department,
            proofFile: club.proofFile,
            role: 'club'
          }
        });
      }
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Admin - Get all clubs (protected: admin only)
router.get('/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const clubs = await Club.find().sort({ createdAt: -1 });
    res.json(clubs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching clubs' });
  }
});

// Admin - Update club status (Approve/Reject) (protected: admin only)
router.patch('/:id/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const clubId = req.params.id;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Approved or Rejected.' });
    }

    const club = await Club.findByIdAndUpdate(
      clubId,
      { status },
      { new: true }
    );

    if (!club) {
      return res.status(404).json({ message: `Club not found.` });
    }

    res.json({ message: `Club "${club.name}" ${status} successfully`, club });
  } catch (error) {
    console.error('Club status update error:', error);
    res.status(500).json({ message: 'Server error while updating club status' });
  }
});

module.exports = router;