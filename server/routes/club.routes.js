const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const supabase = require('../utils/supabase');
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
    const { data: existingEmail } = await supabase
      .from('clubs')
      .select('email')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return res.status(400).json({ message: 'A club with this email already exists' });
    }

    // Check if club name exists
    const { data: existingName } = await supabase
      .from('clubs')
      .select('name')
      .eq('name', name)
      .single();

    if (existingName) {
      return res.status(400).json({ message: 'A club with this name already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: club, error } = await supabase
      .from('clubs')
      .insert([
        {
          name,
          email,
          coordinator,
          department,
          password: hashedPassword,
          proof_file: req.file ? req.file.filename : null,
          status: 'Pending'
        }
      ])
      .select('id, name, email, coordinator, department, status, proofFile:proof_file')
      .single();

    if (error) throw error;

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
    const { data: club, error } = await supabase
      .from('clubs')
      .select('*, proofFile:proof_file')
      .eq('email', email)
      .single();

    if (error || !club) {
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
        id: club.id,
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
            id: club.id,
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
    const { data: clubs, error } = await supabase
      .from('clubs')
      .select('_id:id, id, name, email, coordinator, department, status, proofFile:proof_file, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
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

    if (!clubId || clubId === 'undefined') {
      return res.status(400).json({ message: 'Invalid club ID.' });
    }

    // First verify the club exists
    const { data: existing, error: findError } = await supabase
      .from('clubs')
      .select('id, name')
      .eq('id', clubId)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ message: `Club not found. ID: ${clubId}` });
    }

    // Update the status
    const { data: club, error: updateError } = await supabase
      .from('clubs')
      .update({ status })
      .eq('id', clubId)
      .select('_id:id, id, name, email, coordinator, department, status, proofFile:proof_file, created_at')
      .single();

    if (updateError) throw updateError;

    res.json({ message: `Club "${club.name}" ${status} successfully`, club });
  } catch (error) {
    console.error('Club status update error:', error);
    res.status(500).json({ message: 'Server error while updating club status' });
  }
});

module.exports = router;
