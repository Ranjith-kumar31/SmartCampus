import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAdmin() {
  try {
    console.log('✅ Connected to Supabase');

    // Remove existing admin to avoid duplicates
    await supabase.from('admins').delete().eq('email', 'admin@smartcampus.edu');

    const plainPassword = 'Admin@Vishnu2026';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const { error } = await supabase.from('admins').insert([{
      name: 'Vishnu Selvam',
      email: 'admin@smartcampus.edu',
      password: hashedPassword
    }]);

    if (error) throw error;

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
