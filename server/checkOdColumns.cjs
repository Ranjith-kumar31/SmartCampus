require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data, error } = await s.from('od_requests').select('*').limit(1);
  if (error) { console.error('Error:', error.message); return; }
  
  if (data && data.length > 0) {
    console.log('✅ od_requests columns:', Object.keys(data[0]));
  } else {
    console.log('Table is empty');
  }
})();
