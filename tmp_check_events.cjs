const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkEvents() {
    const { data, error } = await supabase.from('events').select('title, status, date').eq('status', 'Approved');
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

checkEvents();
