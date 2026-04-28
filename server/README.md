# 🚀 Smart Campus Server

This is the backend API for the Smart Campus platform, built with Node.js, Express, and MongoDB.

## 🛠️ Features
- **JWT Authentication**: Secure login and session management.
- **Role-Based Access Control**: Different permissions for Admins, HODs, Clubs, and Students.
- **MongoDB Integration**: Robust data storage using Mongoose ODM.
- **AI Integration**: Custom logic for event search and chatbot responses.
- **Payment Processing**: Integrated with Razorpay.
- **Email Services**: Automated notifications via EmailJS and Nodemailer.

## 📂 Structure
- `/routes`: API endpoints.
- `/middleware`: Auth and validation logic.
- `/utils`: Helper functions for DB, Email, etc.
- `/models`: Mongoose schemas.

## 🚀 Getting Started
1. `npm install`
2. Configure `.env` (see root README for details)
3. `npm run dev`
