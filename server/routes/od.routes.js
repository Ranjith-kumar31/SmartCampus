const express = require('express');
const ODRequest = require('../models/ODRequest');
const Registration = require('../models/Registration');
const Student = require('../models/Student');
const Event = require('../models/Event');
const { verifyToken, isHOD } = require('../middleware/auth');

const router = express.Router();


// Student - create OD Request
router.post('/', async (req, res) => {
  try {
    const { studentId, eventId, reason } = req.body;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if student is registered for the event
    const registration = await Registration.findOne({ event: eventId, student: studentId });

    if (!registration) {
      return res.status(400).json({ message: 'You must register for the event before requesting an OD.' });
    }

    // Check if OD already requested
    const existingOD = await ODRequest.findOne({ student: studentId, event: eventId });

    if (existingOD) {
      return res.status(400).json({ message: 'You have already submitted an OD request for this event.' });
    }

    const newOd = new ODRequest({
        student: studentId,
        event: eventId,
        reason,
        status: 'Pending'
    });

    await newOd.save();

    res.status(201).json({ message: 'OD Request submitted successfully', request: newOd });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while submitting OD request' });
  }
});

// Student - Get all my OD requests
router.get('/student/:id', async (req, res) => {
  try {
    const requests = await ODRequest.find({ student: req.params.id })
        .populate('event', 'title date time')
        .sort({ createdAt: -1 });

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

    const requests = await ODRequest.find({ status: 'Pending' })
        .populate('student')
        .populate('event', 'title date');

    // Filter to HOD's department
    let deptRequests = hodDepartment
      ? requests.filter(r => r.student?.department === hodDepartment)
      : requests;

    // Attach registration details
    const result = await Promise.all(deptRequests.map(async (r) => {
        const reg = await Registration.findOne({ student: r.student?._id, event: r.event?._id });
        return {
            ...r.toObject(),
            registration: reg
        };
    }));

    res.json(result);
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

    const request = await ODRequest.findByIdAndUpdate(
        req.params.id,
        { status, hodRemarks: remarks },
        { new: true }
    );

    if (!request) return res.status(404).json({ message: 'OD Request not found' });
    res.json({ message: `OD Request ${status}`, request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating OD request' });
  }
});

module.exports = router;

