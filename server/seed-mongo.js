const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const HOD = require('./models/HOD');

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartcampus';

const adminData = {
  name: 'Vishnu Selvam',
  email: 'admin@smartcampus.edu',
  password: 'Admin@Vishnu2026'
};

const hods = [
  { name: 'Dr. A. Kumar', email: 'hod.cse@smartcampus.edu', department: 'CSE', password: 'HOD@CSE123' },
  { name: 'Dr. B. Sharma', email: 'hod.it@smartcampus.edu', department: 'IT', password: 'HOD@IT123' },
  { name: 'Dr. C. Raj', email: 'hod.ece@smartcampus.edu', department: 'ECE', password: 'HOD@ECE123' },
  { name: 'Dr. D. Priya', email: 'hod.eee@smartcampus.edu', department: 'EEE', password: 'HOD@EEE123' },
  { name: 'Dr. E. Suresh', email: 'hod.mech@smartcampus.edu', department: 'MECH', password: 'HOD@MECH123' },
  { name: 'Dr. F. Anand', email: 'hod.civil@smartcampus.edu', department: 'CIVIL', password: 'HOD@CIVIL123' },
  { name: 'Dr. G. Meena', email: 'hod.aiml@smartcampus.edu', department: 'AIML', password: 'HOD@AIML123' },
];

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 1. Seed Admin
    console.log('Seeding Admin...');
    await Admin.deleteMany({ email: adminData.email });
    const saltAdmin = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash(adminData.password, saltAdmin);
    
    await Admin.create({
      name: adminData.name,
      email: adminData.email,
      password: hashedAdminPassword,
      role: 'admin'
    });
    console.log('✅ Admin account seeded');

    // 2. Seed HODs
    console.log('Seeding HODs...');
    for (const hod of hods) {
      await HOD.deleteMany({ email: hod.email });
      const saltHOD = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(hod.password, saltHOD);
      
      await HOD.create({
        name: hod.name,
        email: hod.email,
        password: hashedPassword,
        department: hod.department
      });
    }
    console.log(`✅ ${hods.length} HOD accounts seeded`);

    console.log('\n🌟 MONGODB SEEDING COMPLETED SUCCESSFULLY');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
