const express = require('express');
const supabase = require('../utils/supabase');
const { verifyToken, isHOD } = require('../middleware/auth');

const router = express.Router();


// Student - create OD Request
router.post('/', async (req, res) => {
  try {
    const { studentId, eventId, reason } = req.body;

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) return res.status(404).json({ message: 'Event not found' });

    // Check if student is registered for the event
    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('event_id', eventId)
      .eq('student_id', studentId)
      .single();

    if (regError || !registration) {
      return res.status(400).json({ message: 'You must register for the event before requesting an OD.' });
    }

    // Check if OD already requested
    const { data: existingOD } = await supabase
      .from('od_requests')
      .select('id')
      .eq('student_id', studentId)
      .eq('event_id', eventId)
      .single();

    if (existingOD) {
      return res.status(400).json({ message: 'You have already submitted an OD request for this event.' });
    }

    const { data: newOd, error: insertError } = await supabase
      .from('od_requests')
      .insert([
        {
          student_id: studentId,
          event_id: eventId,
          reason,
          status: 'Pending'
        }
      ])
      .select('*, _id:id, studentId:student_id, eventId:event_id')
      .single();

    if (insertError) throw insertError;

    res.status(201).json({ message: 'OD Request submitted successfully', request: newOd });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while submitting OD request' });
  }
});

// Student - Get all my OD requests
router.get('/student/:id', async (req, res) => {
  try {
    const { data: requests, error } = await supabase
      .from('od_requests')
      .select('*, _id:id, studentId:student_id, eventId:event_id, event:events(title, date, time)')
      .eq('student_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching OD requests' });
  }
});

// HOD - Get all OD requests for students in the HOD's department
router.get('/pending', verifyToken, isHOD, async (req, res) => {
  try {
    const hodDepartment = req.decoded?.user?.department;
    console.log(`OD pending: HOD dept = ${hodDepartment}`);

    const { data: requests, error } = await supabase
      .from('od_requests')
      .select('*, _id:id, studentId:student_id, eventId:event_id, student:students(id, name, department, rollNumber:roll_number), event:events(title, date)')
      .eq('status', 'Pending');

    if (error) throw error;

    // Filter to only show ODs from students in HOD's department
    const deptRequests = hodDepartment
      ? (requests || []).filter(r => r.student?.department === hodDepartment)
      : (requests || []);

    console.log(`Returning ${deptRequests.length} OD requests for dept ${hodDepartment}`);
    res.json(deptRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching pending OD requests' });
  }
});

// HOD - Approve/Reject OD request
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update' });
    }

    const { data: request, error } = await supabase
      .from('od_requests')
      .update({ status, hod_remarks: remarks })
      .eq('id', req.params.id)
      .select('*, _id:id, studentId:student_id, eventId:event_id, hodRemarks:hod_remarks')
      .single();

    if (error || !request) return res.status(404).json({ message: 'OD Request not found' });
    res.json({ message: `OD Request ${status}`, request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating OD request' });
  }
});

module.exports = router;
