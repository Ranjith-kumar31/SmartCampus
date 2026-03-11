import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import MainLayout from './components/layouts/MainLayout';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import ClubDashboard from './pages/ClubDashboard';
import HODdashboard from './pages/HODdashboard';
import AdminDashboard from './pages/AdminDashboard';
import EventDetailsPage from './pages/EventDetailsPage';

function App() {
  return (
    <Router>
      <Toaster position="top-right"
        toastOptions={{
          style: {
            background: '#0f1328',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
      <Routes>
        {/* Public routes with MainLayout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="auth/:type" element={<AuthPage />} />
          <Route path="events/:id" element={<EventDetailsPage />} />
        </Route>

        {/* Dashboard routes — use their own DashboardLayout */}
        <Route path="student/dashboard" element={<StudentDashboard />} />
        <Route path="club/dashboard" element={<ClubDashboard />} />
        <Route path="hod/dashboard" element={<HODdashboard />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
