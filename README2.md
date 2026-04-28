<div align="center">
  <img src="./public/assets/banner.png" alt="Smart Campus Banner" width="100%">

  # 🎓 Smart Campus
  ### *Digital Transformation for Modern Educational Institutions*

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Latest-brightgreen?logo=mongodb)](https://www.mongodb.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

  **Smart Campus** is a premium, all-in-one platform designed to streamline campus operations, from event orchestration to administrative approvals. Built with a modern tech stack and AI-driven features, it brings efficiency and transparency to the collegiate ecosystem.
</div>

---

## 🚀 Key Features

### 👨‍🎓 For Students
- **🤖 CampusBot (AI Assistant)**: A sophisticated chatbot that helps find events, answers academic queries via Wikipedia, and performs real-time web searches.
- **🎯 Smart Event Discovery**: Personalized recommendations based on department and interests.
- **📋 Digital OD Management**: Seamlessly request On-Duty (OD) approvals for events and track status in real-time.
- **🔐 Secure Authentication**: Role-based access control with JWT-protected sessions.
- **📱 Responsive UI**: Optimized for both desktop and mobile devices using Tailwind CSS.

### 🏛️ For Clubs & Organizations
- **📅 Event Orchestration**: Propose, manage, and track campus events through a dedicated dashboard.
- **📊 Engagement Analytics**: Real-time insights into registration numbers and department-wise participation.
- **💳 Payment Integration**: Secure event registration payments via Razorpay.

### 👮 For Admin & HODs
- **⚖️ Streamlined Approvals**: Centralized portal for HODs to review and approve/reject student OD requests.
- **🛠️ Administrative Control**: Manage club registrations, event proposals, and overall campus user data.
- **📧 Automated Notifications**: Instant email alerts for approvals and event updates via EmailJS/Nodemailer.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (via Mongoose), *Legacy support for Supabase* |
| **Styling** | Tailwind CSS |
| **Payments** | Razorpay |
| **AI/NLP** | Custom Intent Engine, Wikipedia API, Serper Web Search |
| **Communication** | EmailJS, Nodemailer |

---

## 📂 Project Architecture

```bash
Smart/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Main application screens
│   │   └── layouts/    # Page layout wrappers
├── server/             # Express.js backend
│   ├── routes/         # API endpoints (Admin, Club, HOD, User)
│   ├── middleware/     # Auth & validation logic
│   └── utils/          # Helper functions (Email, DB, etc.)
└── database/           # Migration & seeding scripts
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js (v20 or higher)
- MongoDB Compass (Local Instance)

### 2. Environment Configuration
Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smartcampus
JWT_SECRET=your_secret_key
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
EMAILJS_PUBLIC_KEY=your_key
SERPER_API_KEY=your_key
```

### 3. Backend Setup
```bash
cd server
npm install
npm run dev
```

### 4. Frontend Setup
```bash
cd ..
npm install
npm run dev
```

---

## 🛡️ Role-Based Access Control (RBAC)

- **Admin**: Full system control, user management, and global settings.
- **HOD**: Department-specific event approvals and student OD management.
- **Club**: Event proposal, member management, and registration tracking.
- **Student**: Event discovery, registration, and OD submission.

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  Built with ❤️ by the Smart Campus Team
</div>
