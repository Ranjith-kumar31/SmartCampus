# 🎓 Smart Campus: Event & OD Management System

A premium, all-in-one platform for campus digital transformation. Smart Campus streamlines event coordination, student participation, and administrative approvals through a seamless digital workflow.

---

## ✨ Key Features

### 👨‍🎓 For Students
- **🤖 Advanced AI Assistant**: A friendly chatbot (CampusBot) that helps find events, answers general knowledge via Wikipedia, and performs real-time Web Searches.
- **🎯 Smart Recommendations**: Personalized event discovery powered by an AI-scoring engine that considers your department and interests.
- **⬅️➡️ Navigation Controls**: Seamlessly navigate through pages with integrated back/forward arrows in the header.
- **🔐 Verified Logout**: Secure logout flow with a confirmation modal triggered by clicking the campus logo.
- **📋 Digital OD Requests**: Submit Outward Duty (OD) requests directly for registered events and track HOD approvals in real-time.

### 🏛️ For Clubs
- **Event Orchestration**: Propose and manage events with ease.
- **Participation Tracking**: Real-time dashboard for registrations and attendance.
- **Member Management**: Track active members and department-wise engagement.

### 👮 For Admin & HODs
- **Streamlined Approvals**: Centralized dashboard to approve club registrations, event proposals, and student OD requests.
- **Analytics**: High-level overview of campus engagement metrics.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion.
- **Backend**: Node.js, Express, Axios.
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL).
- **AI/NLP**: Custom intent detection, Wikipedia API, Serper Web Search API.
- **Payments**: Razorpay Integration.
- **Communication**: EmailJS for automated notifications.

---

## 📂 Project Structure

Organized alphabetically for clean navigation in the Explorer:

1.  **`database/`**: SQL schema documentation, seed scripts (`Admin`, `HOD`), and DB connection tests.
2.  **`frontend/`**: The complete React source code (components, layouts, pages, assets).
3.  **`server/`**: The backend Express API, routes, and utilities.

---

## 🚀 Getting Started

### 1. Database Setup (Supabase)
Run the initial SQL script in your Supabase SQL Editor to initialize the tables (`students`, `clubs`, `events`, `od_requests`, etc.).

Then, populate the initial data:
```bash
cd database
node seedAdmin.js
node seedHODs.js
```

### 2. Backend Setup
1. Go to the `server/` directory:
   ```bash
   cd server
   ```
2. Create a `.env` file and add your credentials:
   ```env
   PORT=5000
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_jwt_secret
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   EMAILJS_PUBLIC_KEY=your_emailjs_key
   SERPER_API_KEY=your_web_search_key
   ```
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```

### 3. Frontend Setup
1. From the root directory:
   ```bash
   npm install
   npm run vishnu
   ```
2. Open your browser at [http://localhost:5173](http://localhost:5173).

---

## 🤖 AI Assistant Capabilities
The platform includes an **Advanced CampusBot** accessible via the chat icon in the bottom-right:
- **Event Analysis**: "Show me AI workshops in my department."
- **Knowledge Retrieval**: "What is Quantum Computing?" (Wiki + Web Search).
- **Campus Info**: "How do I apply for OD?"
- **Spelling Correction**: Handles typos like "evnts" or "hckathon" automatically.

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.
