const express = require('express');
const supabase = require('../utils/supabase');

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

// Admin/HOD - Get all pending events
router.get('/pending', async (req, res) => {
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

// Admin - update event status
router.patch('/:id/status', async (req, res) => {
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

// Register a student for an event
router.post('/:id/register', async (req, res) => {
  try {
    const { studentId } = req.body;
    const eventId = req.params.id;

    // Check if already registered
    const { data: existingReg } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('student_id', studentId)
      .single();

    if (existingReg) {
      return res.status(400).json({ message: 'Student already registered for this event' });
    }

    const { error: regError } = await supabase
      .from('event_registrations')
      .insert([{ event_id: eventId, student_id: studentId }]);

    if (regError) throw regError;

    res.json({ message: 'Successfully registered for the event' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while registering for event' });
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
