const mongoose = require('mongoose');
const Event = require('./models/Event');
const Club = require('./models/Club');
require('dotenv').config();

const seedEvent = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartcampus');
    
    let club = await Club.findOne();
    if (!club) {
        console.log("No club found. Creating a dummy club.");
        club = new Club({
            name: "Coding Club",
            email: "codingclub@example.com",
            password: "password123",
            department: "CSE",
            coordinator: "Dr. Smith"
        });
        await club.save();
    }

    const newEvent = new Event({
      title: "HackTheCampus 2026",
      club: club._id,
      domain: "AI & ML",
      date: "2026-05-15",
      time: "09:00 AM",
      location: "Main Auditorium",
      expectedAudience: 30, // 30 Slots
      regFee: 10,
      description: "A 24-hour hackathon focused on AI and ML. Max team size: 3 members. Total slots: 30 teams.",
      rules: [
        "Each team must have exactly 3 members.",
        "Registration fee is Rs 10 per team.",
        "Only 30 slots are available, first come first serve."
      ],
      prizes: [
        "1st Prize: Rs 5000",
        "2nd Prize: Rs 3000"
      ],
      status: 'Approved' // Pre-approved so it shows up immediately
    });

    await newEvent.save();
    console.log("Successfully created dummy Hackathon event!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating event:", error);
    process.exit(1);
  }
};

seedEvent();
