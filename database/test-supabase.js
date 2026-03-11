const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing connection to Supabase...');
    console.log('URL:', supabaseUrl);

    try {
        // Attempt to list tables or do a simple query
        // We'll just try to select from 'students' (even if empty) to check if schema is there
        const { data, error } = await supabase.from('students').select('count', { count: 'exact', head: true });

        if (error) {
            if (error.code === 'PGRST116' || error.message.includes('relation "students" does not exist')) {
                console.log('Connection successful, but tables do not exist yet.');
                console.log('Please run the SQL schema in your Supabase dashboard.');
            } else {
                console.error('Supabase Error:', error.message);
            }
        } else {
            console.log('Successfully connected to Supabase and verified "students" table!');
        }
    } catch (err) {
        console.error('Unexpected error:', err.message);
    }
}

testConnection();
