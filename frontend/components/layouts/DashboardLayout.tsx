import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LogOut, Menu, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ChatbotWidget from '../ChatbotWidget';
import ThemeToggle from '../ThemeToggle';

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





  return (
    <div className="flex h-screen bg-slate-50 dark:bg-dark overflow-hidden transition-colors duration-300">
      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowLogoutModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl p-10 mt-[-10vh]"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-[2rem] bg-red-50 flex items-center justify-center mb-6">
                  <LogOut className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-primary font-bold text-2xl mb-2">Sign Out?</h3>
                <p className="text-slate-500 mb-8 px-4 font-medium">Are you sure you want to end your current session?</p>
                <div className="flex w-full gap-4">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowLogoutModal(false);
                      handleLogout();
                    }}
                    className="flex-1 px-6 py-4 rounded-2xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                  >
                    Yes, Logout
                  </button>
                </div>
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
            className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div
          className="px-8 py-10 flex items-center gap-4 group cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="bg-primary/5 p-2 rounded-2xl border border-primary/10">
            <img
              src="/logo.jpg"
              alt="Logo"
              className="w-10 h-10 rounded-xl shrink-0 object-cover"
            />
          </div>
          <div>
            <h1 className="text-primary font-black text-xl leading-[0.9] tracking-tighter">
              Smart<span className="text-secondary font-black">Campus</span>
            </h1>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1.5 px-0.5">
              {subtitle || 'Management Hub'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
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
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] text-sm font-bold transition-all duration-300 ${isActive
                    ? `bg-primary text-white shadow-xl shadow-primary/15 scale-[1.02]`
                    : 'text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-secondary hover:bg-primary/5 dark:hover:bg-primary/10'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-secondary' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom Area */}
        <div className="px-5 pb-8 mt-auto">
          {bottomWidget === 'support' ? (
            <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Help Center</p>
              <p className="text-primary font-bold text-sm mb-4 leading-tight">Got questions? We're here to help.</p>
              <button className={`w-full bg-primary text-white text-xs font-bold py-3 px-4 rounded-xl hover:bg-primary/95 transition-all shadow-md active:scale-95`}>
                Contact Support
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 px-3 py-4 border-t border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
                <span className="text-primary font-black text-base">{userName.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-primary text-sm font-bold truncate tracking-tight">{userName}</p>
                <p className="text-slate-400 text-xs font-semibold tabular-nums tracking-widest uppercase">{userRole}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-4 px-5 py-4 mt-4 rounded-[1.25rem] text-sm font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex items-center px-6 lg:px-10 flex-shrink-0 relative z-30 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
          {/* Mobile menu toggle */}
          <button className="lg:hidden mr-4 p-2 bg-slate-100 rounded-xl text-slate-600 hover:text-primary transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>

          {/* Page Title Area */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 text-primary dark:text-white font-black text-2xl tracking-tight">
              {titleIcon}
              {title}
            </div>
          </div>

          {/* Search */}
          <div className="hidden xl:flex items-center ml-12 flex-1 max-w-md">
            <div className="relative w-full group">
              <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl pl-12 pr-6 py-3.5 text-sm text-primary dark:text-white font-medium placeholder-slate-400 focus:outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all"
              />
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-5 ml-auto">
            <ThemeToggle />
            <button className="relative p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all">
              <Bell className="w-6 h-6" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="relative pl-6 border-l border-slate-200">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-4 group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-primary dark:text-white text-sm font-black tracking-tight leading-none mb-1">{userName}</p>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    {userId ? `ID: ${userId.toUpperCase()}` : userRole}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-slate-800 flex items-center justify-center border-4 border-slate-50 shadow-lg group-hover:scale-105 transition-all">
                  <span className="text-white font-black text-base uppercase leading-none">{userName.charAt(0)}</span>
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
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      className="absolute right-0 mt-5 w-60 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.75rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] z-50 py-3 overflow-hidden p-2"
                    >
                      <button
                        onClick={() => {
                          onViewChange('profile');
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-slate-600 hover:bg-primary/5 hover:text-primary rounded-2xl transition-all text-left"
                      >
                        <HelpCircle className="w-5 h-5" /> Account Details
                      </button>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all text-left"
                      >
                        <LogOut className="w-5 h-5" /> End Session
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area with extra cushioning */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12">
          {children}
        </main>
      </div>

      {/* Global Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
};

export default DashboardLayout;
