const express = require('express');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Club = require('../models/Club');
const Student = require('../models/Student');
const { verifyToken, isAdmin, isHOD } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// Get all approved events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ status: 'Approved' }).populate('club');
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

    const newEvent = new Event({
      title,
      club: clubId,
      domain,
      date,
      time,
      location,
      expectedAudience,
      regFee,
      description,
      rules: rules || [],
      prizes: prizes || [],
      status: 'Pending'
    });

    await newEvent.save();

    // Notify Admin about the new event proposal
    sendEmail({
      to_name: 'System Administrator',
      to_email: 'admin@smartcampus.edu',
      message: `A new event proposal "${title}" has been submitted by a club. Please review it in the admin dashboard.`
    }).catch(err => console.error("Failed to send admin notification email:", err));

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

    // Find all clubs in this department
    const clubsInDept = await Club.find({ department: hodDepartment }).select('_id');
    const clubIds = clubsInDept.map(c => c._id);

    const pendingEvents = await Event.find({
      status: 'Pending',
      club: { $in: clubIds }
    }).populate('club');

    res.json(pendingEvents);
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

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use Approved or Rejected.' });
    }

    const event = await Event.findById(eventId).populate('club');

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Validate department
    if (hodDepartment && event.club?.department && event.club.department !== hodDepartment) {
      return res.status(403).json({
        message: `Access denied. This event belongs to the ${event.club.department} department.`
      });
    }

    if (event.status !== 'Pending') {
      return res.status(400).json({ message: `This event is already ${event.status}.` });
    }

    event.status = status;
    // If you add remarks to the schema, save them here
    await event.save();

    // Notify Club about HOD's decision
    if (event.club && event.club.email) {
      sendEmail({
        to_name: event.club.name,
        to_email: event.club.email,
        message: `Your event proposal "${event.title}" has been ${status} by the HOD of ${hodDepartment} department.`
      }).catch(err => console.error("Failed to send club notification email:", err));
    }

    res.json({
      message: `Event "${event.title}" ${status} successfully!`,
      event,
    });
  } catch (error) {
    console.error('HOD event approve error:', error);
    res.status(500).json({ message: 'Server error while processing event approval' });
  }
});


// Admin/HOD - Get all pending events (protected: admin only)
router.get('/pending', verifyToken, isAdmin, async (req, res) => {
  try {
    const events = await Event.find({ status: 'Pending' }).populate('club');
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
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Notify Club about Admin's decision
    const populatedEvent = await Event.findById(req.params.id).populate('club');
    if (populatedEvent && populatedEvent.club && populatedEvent.club.email) {
      sendEmail({
        to_name: populatedEvent.club.name,
        to_email: populatedEvent.club.email,
        message: `The system administrator has updated your event "${populatedEvent.title}" status to: ${status}.`
      }).catch(err => console.error("Failed to send club status update email:", err));
    }

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

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.status !== 'Approved') {
      return res.status(400).json({ message: 'This event is not open for registration' });
    }

    // Check if already registered
    const existingReg = await Registration.findOne({ event: eventId, student: studentId });

    if (existingReg) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }

    const reg = new Registration({
      event: eventId,
      student: studentId,
      phone,
      year,
      branch,
    });

    await reg.save();

    // Add to event's array
    if (!event.registeredStudents.includes(studentId)) {
        event.registeredStudents.push(studentId);
        await event.save();
    }

    // Send confirmation email to student
    const student = await Student.findById(studentId);
    if (student && student.email) {
      sendEmail({
        to_name: student.name,
        to_email: student.email,
        message: `Congratulations! You have successfully registered for the event "${event.title}". We look forward to seeing you there!`
      }).catch(err => console.error("Failed to send registration confirmation email:", err));
    }

    res.json({ message: `Successfully registered for "${event.title}"! 🎉`, registrationId: reg._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while registering for event' });
  }
});

// Student — get all events they have registered for
router.get('/student/:studentId/registered', async (req, res) => {
  try {
    const { studentId } = req.params;

    const registrations = await Registration.find({ student: studentId })
        .populate({
            path: 'event',
            populate: { path: 'club' }
        })
        .sort({ createdAt: -1 });

    const registeredEvents = registrations.map(r => ({
      registrationId: r._id,
      registeredAt: r.createdAt,
      phone: r.phone,
      year: r.year,
      branch: r.branch,
      ...r.event.toObject(),
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
    const events = await Event.find({ club: req.params.clubId }).sort({ createdAt: -1 });

    const eventsWithCounts = await Promise.all(events.map(async (e) => {
        const count = await Registration.countDocuments({ event: e._id });
        return {
            ...e.toObject(),
            registration_count: count,
        };
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
    const registrations = await Registration.find({ event: req.params.id })
        .populate('student')
        .sort({ createdAt: -1 });

    const participants = registrations.map(r => ({
      registrationId: r._id,
      registeredAt: r.createdAt,
      studentId: r.student?._id,
      name: r.student?.name || 'Unknown',
      email: r.student?.email || 'N/A',
      department: r.student?.department || 'N/A',
      rollNumber: r.student?.rollNumber || 'N/A',
      phone: r.phone || 'N/A',
      year: r.year || 'N/A',
      branch: r.branch || 'N/A',
      isCheckedIn: r.isCheckedIn || false,
      checkedInAt: r.checkedInAt,
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

    const reg = await Registration.findOne({ event: eventId, student: studentId });

    if (!reg) {
      return res.status(404).json({ message: 'Registration not found for this student and event' });
    }

    if (reg.isCheckedIn) {
      return res.status(400).json({ message: 'Student already checked in' });
    }

    reg.isCheckedIn = true;
    reg.checkedInAt = new Date();
    await reg.save();

    res.json({ message: 'Check-in successful! ✅' });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error during check-in' });
  }
});

// Delete an event (Club)
router.delete('/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    // Also delete registrations
    await Registration.deleteMany({ event: req.params.id });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting event' });
  }
});

module.exports = router;

