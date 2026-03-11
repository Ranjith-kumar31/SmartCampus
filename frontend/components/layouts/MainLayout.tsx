import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, GraduationCap, Building2, UserCog, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ChatbotWidget from '../ChatbotWidget';

const MainLayout = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    setMobileMenuOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Suppress unused variable warning — location may be used by child routes
  void location;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowLogoutModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#0c1021] border border-white/[0.08] rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <LogOut className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Confirm Logout</h3>
                  <p className="text-slate-400 text-sm">Do you want to logout?</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.08] text-slate-300 text-sm font-medium hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    handleLogout();
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#080b14]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-lg py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Back / Forward navigation */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/[0.08]"
                title="Go back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate(1)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/[0.08]"
                title="Go forward"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Logo — shows logout modal if authenticated */}
            <Link
              to="/"
              className="flex items-center gap-2.5 group"
              onClick={(e) => {
                if (isAuthenticated) {
                  e.preventDefault();
                  setShowLogoutModal(true);
                }
              }}
            >
              <img
                src="/logo.jpg"
                alt="Smart Campus Logo"
                className="w-9 h-9 rounded-xl shadow-lg shadow-white/10 group-hover:shadow-white/20 transition-shadow object-cover"
              />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Smart Campus Event Management
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/#features" className="nav-link">Features</Link>
            <Link to="/#events" className="nav-link">Events</Link>

            <div className="flex gap-3">
              <Link to="/auth/student" className="btn-secondary flex items-center gap-2 text-sm">
                <GraduationCap className="w-4 h-4" /> Student
              </Link>
              <Link to="/auth/club" className="btn-primary flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4" /> Club
              </Link>
              <Link to="/auth/hod" className="btn-secondary flex items-center gap-2 text-sm">
                <UserCog className="w-4 h-4" /> HOD Login
              </Link>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-slate-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-[70px] left-0 w-full bg-[#0c1021]/95 backdrop-blur-xl border-b border-white/[0.06] z-40 md:hidden overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              <Link to="/" className="text-lg text-slate-200 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link to="/#features" className="text-lg text-slate-200 hover:text-white" onClick={() => setMobileMenuOpen(false)}>Features</Link>
              <div className="h-[1px] bg-white/[0.06] my-2" />
              <Link to="/auth/student" className="flex items-center gap-3 text-lg text-slate-200" onClick={() => setMobileMenuOpen(false)}>
                <GraduationCap className="w-5 h-5 text-indigo-400" /> Student Portal
              </Link>
              <Link to="/auth/club" className="flex items-center gap-3 text-lg text-slate-200" onClick={() => setMobileMenuOpen(false)}>
                <Building2 className="w-5 h-5 text-violet-400" /> Club Portal
              </Link>
              <Link to="/auth/hod" className="flex items-center gap-3 text-lg text-slate-200" onClick={() => setMobileMenuOpen(false)}>
                <UserCog className="w-5 h-5 text-amber-400" /> HOD Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-12">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#0c1021]/50 border-t border-white/[0.04] py-12 mt-auto">
        <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <img src="/logo.jpg" alt="Smart Campus Logo" className="w-8 h-8 rounded-xl object-cover shadow-md shadow-white/5" />
              <span className="text-xl font-bold text-white">Smart Campus Event Management</span>
            </div>
            <p className="text-slate-500 max-w-sm text-sm">
              A comprehensive full-stack web application for managing campus events, club activities, student registrations, and OD requests.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/auth/student" className="text-slate-500 hover:text-white transition-colors text-sm">Students</Link></li>
              <li><Link to="/auth/club" className="text-slate-500 hover:text-white transition-colors text-sm">Clubs</Link></li>
              <li><Link to="/auth/hod" className="text-slate-500 hover:text-white transition-colors text-sm">HOD Portal</Link></li>
              <li><Link to="/auth/admin" className="text-slate-500 hover:text-white transition-colors text-sm">Admin</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Contact</h4>
            <ul className="space-y-2 text-slate-500 text-sm">
              <li>support@smartcampus.edu</li>
              <li>+1 234 567 8900</li>
              <li>123 University Ave, Tech City</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-6 md:px-12 mt-12 pt-8 border-t border-white/[0.04] text-center text-slate-600 text-sm">
          &copy; {new Date().getFullYear()} Smart Campus Event Management. All rights reserved.
        </div>
      </footer>

      {/* Global Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
};

export default MainLayout;
