const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: '../server/.env' });

const hodSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  department: String,
}, { timestamps: true });

const HOD = mongoose.model('HOD', hodSchema);

const hods = [
  { name: 'Dr. A. Kumar',    email: 'hod.cse@smartcampus.edu',   department: 'CSE',   password: 'HOD@CSE123'   },
  { name: 'Dr. B. Sharma',   email: 'hod.it@smartcampus.edu',    department: 'IT',    password: 'HOD@IT123'    },
  { name: 'Dr. C. Raj',      email: 'hod.ece@smartcampus.edu',   department: 'ECE',   password: 'HOD@ECE123'   },
  { name: 'Dr. D. Priya',    email: 'hod.eee@smartcampus.edu',   department: 'EEE',   password: 'HOD@EEE123'   },
  { name: 'Dr. E. Suresh',   email: 'hod.mech@smartcampus.edu',  department: 'MECH',  password: 'HOD@MECH123'  },
  { name: 'Dr. F. Anand',    email: 'hod.civil@smartcampus.edu', department: 'CIVIL', password: 'HOD@CIVIL123' },
  { name: 'Dr. G. Meena',    email: 'hod.aiml@smartcampus.edu',  department: 'AIML',  password: 'HOD@AIML123'  },
];

async function seedHODs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📋 HOD Credentials:\n');
    console.log('─'.repeat(70));
    console.log('Dept'.padEnd(8) + 'Email'.padEnd(35) + 'Password');
    console.log('─'.repeat(70));

    for (const hod of hods) {
      // Remove existing record for this department to avoid duplicates
      await HOD.deleteOne({ department: hod.department });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(hod.password, salt);

      await HOD.create({
        name: hod.name,
        email: hod.email,
        password: hashedPassword,
        department: hod.department,
      });

      console.log(
        hod.department.padEnd(8) +
        hod.email.padEnd(35) +
        hod.password
      );
    }

    console.log('─'.repeat(70));
    console.log('\n✅ All HOD accounts created successfully in MongoDB!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedHODs();
