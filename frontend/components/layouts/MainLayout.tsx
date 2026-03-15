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
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled
            ? 'bg-primary border-b border-white/10 shadow-lg py-3'
            : 'bg-primary/95 py-5'
          }`}
      >
        <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Back / Forward navigation */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                title="Go back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate(1)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                title="Go forward"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Logo — shows logout modal if authenticated */}
            <Link
              to="/"
              className="flex items-center gap-3 group"
              onClick={(e) => {
                if (isAuthenticated) {
                  e.preventDefault();
                  setShowLogoutModal(true);
                }
              }}
            >
              <div className="bg-white p-1 rounded-lg">
                <img
                  src="/logo.jpg"
                  alt="Smart Campus Logo"
                  className="w-8 h-8 rounded-md object-cover"
                />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Smart<span className="text-secondary">Campus</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10">
            <div className="flex items-center gap-8">
              <Link to="/" className="nav-link group">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                Home
              </Link>
              <Link to="/explore" className="nav-link group">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                Live Hub
              </Link>
            </div>

            <div className="h-4 w-[1px] bg-white/20" />

            <div className="flex gap-3">
              <Link to="/auth/student" className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-5 rounded-full transition-all text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Student
              </Link>
              <Link to="/auth/club" className="bg-secondary hover:bg-secondary/90 text-white font-medium py-2 px-6 rounded-full transition-all text-sm flex items-center gap-2 shadow-lg shadow-secondary/20">
                <Building2 className="w-4 h-4" /> Club
              </Link>
              <Link to="/auth/hod" className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-5 rounded-full transition-all text-sm flex items-center gap-2">
                <UserCog className="w-4 h-4" /> HOD
              </Link>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-white"
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[70px] left-0 w-full bg-primary border-b border-white/10 z-40 md:hidden shadow-2xl"
          >
            <div className="flex flex-col p-6 gap-6">
              <Link to="/" className="text-[11px] font-black uppercase tracking-widest text-white flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-1.5 h-1.5 rounded-full bg-secondary" /> Home
              </Link>
              <Link to="/explore" className="text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-white flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Live Hub
              </Link>
              <div className="h-[1px] bg-white/10 my-2" />
              <Link to="/auth/student" className="flex items-center gap-3 text-lg text-white font-medium" onClick={() => setMobileMenuOpen(false)}>
                <GraduationCap className="w-5 h-5 text-secondary" /> Student Portal
              </Link>
              <Link to="/auth/club" className="flex items-center gap-3 text-lg text-white font-medium" onClick={() => setMobileMenuOpen(false)}>
                <Building2 className="w-5 h-5 text-secondary" /> Club Portal
              </Link>
              <Link to="/auth/hod" className="flex items-center gap-3 text-lg text-white font-medium" onClick={() => setMobileMenuOpen(false)}>
                <UserCog className="w-5 h-5 text-secondary" /> HOD Login
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
      <footer className="bg-slate-50 border-t border-slate-200 py-16 mt-auto">
        <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-lg shadow-sm border border-slate-200">
                <img src="/logo.jpg" alt="Smart Campus Logo" className="w-8 h-8 rounded-md object-cover" />
              </div>
              <span className="text-2xl font-bold text-primary tracking-tight">
                Smart<span className="text-secondary">Campus</span>
              </span>
            </div>
            <p className="text-slate-500 max-w-sm text-base leading-relaxed">
              Elevating campus experience through seamless event management and administrative efficiency.
            </p>
          </div>

          <div>
            <h4 className="text-primary font-bold mb-6 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link to="/explore" className="text-slate-500 hover:text-primary transition-colors text-sm font-medium">Explore Events</Link></li>
              <li><Link to="/auth/club" className="text-slate-500 hover:text-primary transition-colors text-sm font-medium">Clubs</Link></li>
              <li><Link to="/auth/hod" className="text-slate-500 hover:text-primary transition-colors text-sm font-medium">HOD Portal</Link></li>
              <li><Link to="/auth/admin" className="text-slate-500 hover:text-primary transition-colors text-sm font-medium">Admin</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-primary font-bold mb-6 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3 text-slate-500 text-sm font-medium">
              <li className="hover:text-primary transition-colors cursor-pointer">support@smartcampus.edu</li>
              <li className="hover:text-primary transition-colors cursor-pointer">+1 234 567 8900</li>
              <li className="hover:text-primary transition-colors cursor-pointer">123 University Ave, Tech City</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-6 md:px-12 mt-16 pt-8 border-t border-slate-200 text-center text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} Smart Campus Event Management. Crafted for Excellence.
        </div>
      </footer>

      {/* Global Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
};

export default MainLayout;
