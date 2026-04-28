const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const Admin = require('../server/models/Admin');
const Student = require('../server/models/Student');
const HOD = require('../server/models/HOD');
const Club = require('../server/models/Club');
const Event = require('../server/models/Event');
const ODRequest = require('../server/models/ODRequest');
const Registration = require('../server/models/Registration');


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mongoUri = process.env.MONGODB_URI;

if (!supabaseUrl || !supabaseKey || !mongoUri) {
  console.error('Missing environment variables. Check server/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 1. Migrate Admins
    console.log('Migrating Admins...');
    const { data: admins } = await supabase.from('admins').select('*');
    for (const admin of admins) {
      await Admin.findOneAndUpdate(
        { email: admin.email },
        {
          name: admin.name,
          email: admin.email,
          password: admin.password,
          role: admin.role || 'admin',
        },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Migrated ${admins.length} admins`);

    // 2. Migrate HODs
    console.log('Migrating HODs...');
    const { data: hods } = await supabase.from('hods').select('*');
    for (const hod of hods) {
      await HOD.findOneAndUpdate(
        { email: hod.email },
        {
          name: hod.name,
          email: hod.email,
          password: hod.password,
          department: hod.department,
        },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Migrated ${hods.length} HODs`);

    // 3. Migrate Students
    console.log('Migrating Students...');
    const { data: students } = await supabase.from('students').select('*');
    for (const student of students) {
      await Student.findOneAndUpdate(
        { email: student.email },
        {
          name: student.name,
          email: student.email,
          password: student.password,
          department: student.department,
          rollNumber: student.roll_number || student.rollNumber,
          isVerified: student.is_verified ?? student.isVerified ?? false,
        },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Migrated ${students.length} students`);

    // 4. Migrate Clubs
    console.log('Migrating Clubs...');
    const { data: clubs } = await supabase.from('clubs').select('*');
    for (const club of clubs) {
      await Club.findOneAndUpdate(
        { email: club.email },
        {
          name: club.name,
          email: club.email,
          password: club.password,
          coordinator: club.coordinator,
          department: club.department,
          proofFile: club.proof_file || club.proofFile,
          status: club.status || 'Pending',
        },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Migrated ${clubs.length} clubs`);

    // 5. Migrate Events (requires club mapping)
    console.log('Migrating Events...');
    const { data: events } = await supabase.from('events').select('*');
    for (const event of events) {
      // Find the club ID in MongoDB by matching email (assuming email is unique across providers)
      // or just use the name if that's what we have.
      // Usually, in Supabase, 'club' might be an ID. Let's try to find the club.
      const { data: supabaseClub } = await supabase.from('clubs').select('email').eq('id', event.club).single();
      let mongoClubId = null;
      if (supabaseClub) {
          const mClub = await Club.findOne({ email: supabaseClub.email });
          if (mClub) mongoClubId = mClub._id;
      }

      await Event.findOneAndUpdate(
        { title: event.title, date: event.date },
        {
          title: event.title,
          club: mongoClubId,
          domain: event.domain,
          date: event.date,
          time: event.time,
          location: event.location,
          expectedAudience: event.expected_audience || event.expectedAudience,
          regFee: event.reg_fee || event.regFee || 0,
          description: event.description,
          rules: Array.isArray(event.rules) ? event.rules : (event.rules ? [event.rules] : []),
          prizes: Array.isArray(event.prizes) ? event.prizes : (event.prizes ? [event.prizes] : []),
          status: event.status || 'Pending',
        },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Migrated ${events.length} events`);

    // 6. Handle Event Registrations (mapping to Registration model)
    console.log('Migrating Event Registrations...');
    const { data: registrations } = await supabase.from('event_registrations').select('*');
    if (registrations) {
        for (const reg of registrations) {
            // Find student email
            const { data: sData } = await supabase.from('students').select('email').eq('id', reg.student_id).single();
            // Find event title
            const { data: eData } = await supabase.from('events').select('title, date').eq('id', reg.event_id).single();

            if (sData && eData) {
                const mStudent = await Student.findOne({ email: sData.email });
                const mEvent = await Event.findOne({ title: eData.title, date: eData.date });

                if (mStudent && mEvent) {
                    await Registration.findOneAndUpdate(
                        { event: mEvent._id, student: mStudent._id },
                        {
                            event: mEvent._id,
                            student: mStudent._id,
                            phone: reg.phone,
                            year: reg.year,
                            branch: reg.branch,
                            isCheckedIn: reg.is_checked_in || false,
                            checkedInAt: reg.checked_in_at
                        },
                        { upsert: true }
                    );
                    
                    // Also add to event's registeredStudents array for quick access if needed
                    if (!mEvent.registeredStudents.includes(mStudent._id)) {
                        mEvent.registeredStudents.push(mStudent._id);
                        await mEvent.save();
                    }
                }
            }
        }
    }
    console.log(`✅ Migrated registrations`);


    // 7. Migrate OD Requests
    console.log('Migrating OD Requests...');
    const { data: ods } = await supabase.from('od_requests').select('*');
    if (ods) {
        for (const od of ods) {
            // Mapping
            const { data: sData } = await supabase.from('students').select('email').eq('id', od.student_id).single();
            const { data: eData } = await supabase.from('events').select('title, date').eq('id', od.event_id).single();

            if (sData && eData) {
                const mStudent = await Student.findOne({ email: sData.email });
                const mEvent = await Event.findOne({ title: eData.title, date: eData.date });

                if (mStudent && mEvent) {
                    await ODRequest.findOneAndUpdate(
                        { student: mStudent._id, event: mEvent._id },
                        {
                            student: mStudent._id,
                            event: mEvent._id,
                            status: od.status || 'Pending',
                            reason: od.reason,
                            hodRemarks: od.hod_remarks || od.hodRemarks
                        },
                        { upsert: true }
                    );
                }
            }
        }
    }
    console.log(`✅ Migrated OD requests`);

    console.log('\n🌟 MIGRATION COMPLETED SUCCESSFULLY');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
