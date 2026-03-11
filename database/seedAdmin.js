const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: '../server/.env' });

const adminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: 'admin' },
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Remove existing admin to avoid duplicates
    await Admin.deleteOne({ email: 'admin@smartcampus.edu' });

    const plainPassword = 'Admin@Vishnu2026';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    await Admin.create({
      name: 'Vishnu Selvam',
      email: 'admin@smartcampus.edu',
      password: hashedPassword,
      role: 'admin',
    });

    console.log('\n┌──────────────────────────────────────────────┐');
    console.log('│           ADMIN ACCOUNT CREATED ✅            │');
    console.log('├──────────────────────────────────────────────┤');
    console.log('│  Name     : Vishnu Selvam                     │');
    console.log('│  Email    : admin@smartcampus.edu             │');
    console.log('│  Password : Admin@Vishnu2026                  │');
    console.log('│  Role     : System Administrator              │');
    console.log('└──────────────────────────────────────────────┘\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedAdmin();
