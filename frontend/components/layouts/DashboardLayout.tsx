import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LogOut, Menu, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import ChatbotWidget from '../ChatbotWidget';

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  titleIcon?: React.ReactNode;
  navItems: NavItem[];
  activeView: string;
  onViewChange: (view: string) => void;
  userName: string;
  userRole: string;
  userId?: string;
  userAvatar?: string;
  accentColor?: string;
  searchPlaceholder?: string;
  bottomWidget?: 'support' | 'profile';
}

const DashboardLayout = ({
  children,
  title,
  subtitle,
  titleIcon,
  navItems,
  activeView,
  onViewChange,
  userName,
  userRole,
  accentColor = 'indigo',
  searchPlaceholder = 'Search...',
  bottomWidget = 'support',
  userId,
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const accentClasses: Record<string, { bg: string; text: string; activeBg: string; ring: string }> = {
    indigo: { bg: 'bg-indigo-600', text: 'text-indigo-400', activeBg: 'bg-indigo-600', ring: 'ring-indigo-500/30' },
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-400', activeBg: 'bg-emerald-600', ring: 'ring-emerald-500/30' },
    violet: { bg: 'bg-violet-600', text: 'text-violet-400', activeBg: 'bg-violet-600', ring: 'ring-violet-500/30' },
    blue: { bg: 'bg-blue-600', text: 'text-blue-400', activeBg: 'bg-blue-600', ring: 'ring-blue-500/30' },
  };

  const accent = accentClasses[accentColor] || accentClasses.indigo;

  return (
    <div className="flex h-screen bg-[#080b14] overflow-hidden">
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

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[220px] bg-[#0c1021] border-r border-white/[0.06] flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo — click triggers logout confirmation */}
        <div
          className="px-5 py-5 flex items-center gap-3 cursor-pointer group"
          onClick={() => setShowLogoutModal(true)}
        >
          <img
            src="/logo.jpg"
            alt="Logo"
            className="w-10 h-10 rounded-xl shadow-lg shadow-white/10 shrink-0 object-cover group-hover:scale-105 transition-transform"
          />
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">
              Smart Campus<br />
              <span className="text-[10px] text-indigo-400 font-normal">Event Management</span>
            </h1>
            <p className={`text-[10px] uppercase tracking-[0.2em] font-semibold ${accent.text}`}>
              {subtitle || 'Events Hub'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? `${accent.activeBg} text-white shadow-lg shadow-indigo-500/20`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom Widget */}
        <div className="px-3 pb-4 mt-auto">
          {bottomWidget === 'support' ? (
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-slate-500 text-xs">Need help?</p>
              <p className="text-slate-300 text-sm font-medium mb-3">Visit Support Center</p>
              <button className={`w-full ${accent.bg} text-white text-xs font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity`}>
                Contact Us
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-2 py-3 border-t border-white/[0.06]">
              <div className={`w-9 h-9 rounded-full ${accent.bg}/20 flex items-center justify-center`}>
                <span className={`${accent.text} font-bold text-sm`}>{userName.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{userName}</p>
                <p className="text-slate-500 text-xs truncate">{userRole}</p>
              </div>
            </div>
          )}

          {/* Sidebar Logout Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl text-[13px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/[0.06] bg-[#0c1021]/80 backdrop-blur-xl flex items-center px-4 lg:px-6 flex-shrink-0">
          {/* Mobile menu toggle */}
          <button className="lg:hidden mr-3 text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          {/* Back / Forward navigation */}
          <div className="flex items-center gap-1 mr-4">
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

          <div className="flex items-center gap-2 text-white font-semibold text-[15px]">
            {titleIcon}
            {title}
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center ml-8 flex-1 max-w-md">
            <div className="relative w-full">
              <svg className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4 ml-auto">
            <button className="relative text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0c1021]" />
            </button>

            <div className="relative pl-4 border-l border-white/[0.08]">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-white text-sm font-medium">{userName}</p>
                  <p className="text-slate-500 text-[10px] tabular-nums">
                    {userId ? `ID: ${userId.toUpperCase()}` : userRole}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-white/10 shadow-lg shadow-indigo-500/20">
                  <span className="text-white font-bold text-sm">{userName.charAt(0)}</span>
                </div>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-48 bg-[#0c1021] border border-white/[0.08] rounded-xl shadow-2xl z-50 py-2 overflow-hidden"
                    >
                      <div className="px-4 py-2 border-b border-white/[0.04] mb-1 sm:hidden">
                        <p className="text-white text-sm font-medium truncate">{userName}</p>
                        <p className="text-slate-500 text-[10px] truncate">{userId ? `ID: ${userId.toUpperCase()}` : userRole}</p>
                      </div>

                      <button
                        onClick={() => {
                          onViewChange('profile');
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.04] hover:text-white transition-colors text-left"
                      >
                        <HelpCircle className="w-4 h-4" /> My Profile
                      </button>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/5 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Global Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
};

export default DashboardLayout;
