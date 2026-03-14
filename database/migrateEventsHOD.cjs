// Run this script to add HOD approval columns to the events table in Supabase
// Usage: node database/migrateEventsHOD.js

require('dotenv').config({ path: './server/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
  console.log('Adding hod_remarks and hod_approved_at columns to events table...');

  // Supabase JS SDK doesn't support DDL directly, so we use rpc or rest
  // Instead, we'll test a dummy update to see if columns exist first
  const { data, error } = await supabase
    .from('events')
    .select('id, hod_remarks, hod_approved_at')
    .limit(1);

  if (error && error.message.includes('column')) {
    console.log('\n⚠️  Columns do not exist yet.');
    console.log('\nPlease run the following SQL in your Supabase SQL Editor:');
    console.log('─'.repeat(60));
    console.log(`
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS hod_remarks TEXT,
  ADD COLUMN IF NOT EXISTS hod_approved_at TIMESTAMPTZ;
`);
    console.log('─'.repeat(60));
    console.log('\nSteps:');
    console.log('1. Go to https://app.supabase.com');
    console.log('2. Open your project → SQL Editor');
    console.log('3. Paste and run the SQL above');
    console.log('4. Then restart your backend server');
  } else {
    console.log('✅ Columns hod_remarks and hod_approved_at already exist (or no error).');
    console.log('Migration not needed.');
  }
}

migrate().catch(console.error);
