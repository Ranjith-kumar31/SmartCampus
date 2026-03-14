const express = require('express');
const supabase = require('../utils/supabase');
const { verifyToken, isAdmin, isHOD } = require('../middleware/auth');

const router = express.Router();

// Get all approved events
router.get('/', async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*, _id:id, regFee:reg_fee, clubId:club_id, club:clubs(id, _id:id, name, coordinator, email)')
      .eq('status', 'Approved');

    if (error) throw error;
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching events' });
  }
});

// Create a new event (For clubs)
router.post('/', async (req, res) => {
  try {
    const {
      title, clubId, domain, date, time, location,
      expectedAudience, regFee, description, rules, prizes
    } = req.body;

    const { data: newEvent, error } = await supabase
      .from('events')
      .insert([
        {
          title,
          club_id: clubId,
          domain,
          date,
          time,
          location,
          expected_audience: expectedAudience,
          reg_fee: regFee,
          description,
          rules: rules || [],
          prizes: prizes || [],
          status: 'Pending'
        }
      ])
      .select('*, _id:id, regFee:reg_fee, clubId:club_id')
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Event proposed successfully. Pending admin approval.', event: newEvent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while proposing event' });
  }
});

// HOD - Get all pending events from clubs in HOD's own department
router.get('/hod-pending', verifyToken, isHOD, async (req, res) => {
  try {
    const hodDepartment = req.decoded?.user?.department;
    if (!hodDepartment) {
      return res.status(400).json({ message: 'HOD department not found in token' });
    }

    console.log(`HOD pending events: dept=${hodDepartment}`);

    // Fetch all pending events with club info — JS filter handles dept matching
    const { data: events, error } = await supabase
      .from('events')
      .select('*, _id:id, regFee:reg_fee, clubId:club_id, expectedAudience:expected_audience, club:clubs(id, name, coordinator, department, email)')
      .eq('status', 'Pending')
      .not('club_id', 'is', null);

    if (error) { console.error('hod-pending error:', error); throw error; }

    // Filter to only events from clubs in this HOD's department
    const deptEvents = (events || []).filter(e => e.club?.department === hodDepartment);
    console.log(`Returning ${deptEvents.length} events for dept ${hodDepartment}`);

    res.json(deptEvents);
  } catch (error) {
    console.error('HOD pending events error:', error);
    res.status(500).json({ message: 'Server error while fetching pending events for HOD' });
  }
});


// HOD - Approve or Reject an event from their department
router.patch('/:id/hod-approve', verifyToken, isHOD, async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const hodDepartment = req.decoded?.user?.department;
    const eventId = req.params.id;

    console.log(`HOD approve request: eventId=${eventId}, status=${status}, hodDept=${hodDepartment}`);

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use Approved or Rejected.' });
    }

    if (!eventId || eventId === 'undefined') {
      return res.status(400).json({ message: 'Invalid event ID.' });
    }

    // Fetch event with club department info
    // Using alias 'club:clubs(...)' so Supabase returns event.club
    const { data: event, error: findError } = await supabase
      .from('events')
      .select('id, title, status, club_id, club:clubs(id, department)')
      .eq('id', eventId)
      .single();

    if (findError || !event) {
      console.error('Find event error:', findError);
      return res.status(404).json({ message: 'Event not found.' });
    }

    console.log(`Event found: "${event.title}", club dept: ${event.club?.department}, HOD dept: ${hodDepartment}`);

    // Validate the club belongs to the HOD's department
    // If no department on club (edge case), still allow HOD to proceed
    if (hodDepartment && event.club?.department && event.club.department !== hodDepartment) {
      return res.status(403).json({
        message: `Access denied. This event belongs to the ${event.club.department} department. You manage the ${hodDepartment} department.`
      });
    }

    if (event.status !== 'Pending') {
      return res.status(400).json({ message: `This event is already ${event.status} and cannot be changed.` });
    }

    // Update ONLY the status field (hod_remarks/hod_approved_at are optional columns)
    // If you have added them via SQL migration, uncomment the lines below
    const updatePayload = { status };
    // updatePayload.hod_remarks = remarks || `${status} by HOD`;
    // updatePayload.hod_approved_at = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from('events')
      .update(updatePayload)
      .eq('id', eventId)
      .select('id, title, status')
      .single();

    if (updateError) {
      console.error('Supabase update error:', JSON.stringify(updateError));
      throw updateError;
    }

    console.log(`Event "${updated.title}" successfully set to ${status}`);
    res.json({
      message: `Event "${updated.title}" ${status} successfully! ${status === 'Approved' ? 'It is now live on Smart Campus.' : 'The club has been notified.'}`,
      event: updated,
    });
  } catch (error) {
    console.error('HOD event approve error:', error);
    res.status(500).json({ message: error.message || 'Server error while processing event approval' });
  }
});


// Admin/HOD - Get all pending events (protected: admin only)
router.get('/pending', verifyToken, isAdmin, async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*, _id:id, regFee:reg_fee, clubId:club_id, club:clubs(id, _id:id, name, coordinator)')
      .eq('status', 'Pending');

    if (error) throw error;
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching pending events' });
  }
});

// Admin - update event status (protected: admin only)
router.patch('/:id/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const { data: event, error } = await supabase
      .from('events')
      .update({ status })
      .eq('id', req.params.id)
      .select('*, _id:id, regFee:reg_fee, clubId:club_id')
      .single();

    if (error || !event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: `Event status updated to ${status}`, event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating event status' });
  }
});

// Register a student for an event (with registration details form)
router.post('/:id/register', async (req, res) => {
  try {
    const { studentId, phone, year, branch } = req.body;
    const eventId = req.params.id;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Check event exists and is approved
    const { data: event, error: evtErr } = await supabase
      .from('events')
      .select('id, title, status')
      .eq('id', eventId)
      .single();

    if (evtErr || !event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.status !== 'Approved') {
      return res.status(400).json({ message: 'This event is not open for registration' });
    }

    // Check if already registered
    const { data: existingReg } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('student_id', studentId)
      .single();

    if (existingReg) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }

    // Insert with extra details
    const { data: reg, error: regError } = await supabase
      .from('event_registrations')
      .insert([{
        event_id: eventId,
        student_id: studentId,
        phone: phone || null,
        year: year || null,
        branch: branch || null,
      }])
      .select('id')
      .single();

    if (regError) {
      console.error('Registration insert error:', regError);
      throw regError;
    }

    res.json({ message: `Successfully registered for "${event.title}"! 🎉`, registrationId: reg.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while registering for event' });
  }
});

// Student — get all events they have registered for
router.get('/student/:studentId/registered', async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data: registrations, error } = await supabase
      .from('event_registrations')
      .select('id, registered_at, phone, year, branch, event:events(id, title, domain, date, time, location, description, status, reg_fee, club:clubs(name))')
      .eq('student_id', studentId)
      .order('registered_at', { ascending: false });

    if (error) throw error;

    // Shape the response
    const registeredEvents = (registrations || []).map(r => ({
      registrationId: r.id,
      registeredAt: r.registered_at,
      phone: r.phone,
      year: r.year,
      branch: r.branch,
      ...r.event,
      _id: r.event?.id,
    }));

    res.json(registeredEvents);
  } catch (error) {
    console.error('Student registered events error:', error);
    res.status(500).json({ message: 'Server error while fetching registered events' });
  }
});


// Club - Get all events for this club (any status) with registration counts
router.get('/club/:clubId', async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*, _id:id, regFee:reg_fee, clubId:club_id, expectedAudience:expected_audience')
      .eq('club_id', req.params.clubId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Attach registration count to each event
    const eventIds = events.map(e => e.id);
    const { data: regCounts } = await supabase
      .from('event_registrations')
      .select('event_id')
      .in('event_id', eventIds);

    const countMap = {};
    (regCounts || []).forEach(r => {
      countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
    });

    const eventsWithCounts = events.map(e => ({
      ...e,
      registration_count: countMap[e.id] || 0,
    }));

    res.json(eventsWithCounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching club events' });
  }
});

// Club - Get all registered participants for an event
router.get('/:id/participants', async (req, res) => {
  try {
    const { data: registrations, error } = await supabase
      .from('event_registrations')
      .select('id, registered_at, phone, year, branch, student_id, is_checked_in, checked_in_at, student:students(id, name, email, department, rollNumber:roll_number)')
      .eq('event_id', req.params.id)
      .order('registered_at', { ascending: false });

    if (error) {
      console.error('Participants Supabase error:', JSON.stringify(error));
      throw error;
    }

    const participants = (registrations || []).map(r => ({
      registrationId: r.id,
      registeredAt: r.registered_at,
      studentId: r.student_id,
      name: r.student?.name || 'Unknown',
      email: r.student?.email || 'N/A',
      department: r.student?.department || 'N/A',
      rollNumber: r.student?.rollNumber || 'N/A',
      phone: r.phone || 'N/A',
      year: r.year || 'N/A',
      branch: r.branch || 'N/A',
      isCheckedIn: r.is_checked_in || false,
      checkedInAt: r.checked_in_at,
    }));

    res.json({ count: participants.length, participants });
  } catch (error) {
    console.error('Participants error:', error);
    res.status(500).json({ message: 'Server error while fetching participants' });
  }
});

// Club - Mark participant as checked in (QR Scanner)
router.post('/:id/check-in', async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { studentId } = req.body;

    if (!studentId) return res.status(400).json({ message: 'Student ID required' });

    // 1. Verify registration exists
    const { data: reg, error: fetchErr } = await supabase
      .from('event_registrations')
      .select('id, is_checked_in')
      .eq('event_id', eventId)
      .eq('student_id', studentId)
      .single();

    if (fetchErr || !reg) {
      return res.status(404).json({ message: 'Registration not found for this student and event' });
    }

    if (reg.is_checked_in) {
      return res.status(400).json({ message: 'Student already checked in' });
    }

    // 2. Update status
    const { error: updateErr } = await supabase
      .from('event_registrations')
      .update({
        is_checked_in: true,
        checked_in_at: new Date().toISOString()
      })
      .eq('id', reg.id);

    if (updateErr) throw updateErr;

    res.json({ message: 'Check-in successful! ✅' });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error during check-in' });
  }
});



// Delete an event (Club)
router.delete('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting event' });
  }
});

module.exports = router;
