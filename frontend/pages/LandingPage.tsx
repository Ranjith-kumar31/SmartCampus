import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-48 overflow-hidden bg-gradient-to-b from-primary via-primary/95 to-white">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="container mx-auto px-6 md:px-12 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <div className="bg-white p-3 rounded-[2.5rem] shadow-2xl border border-white/20 inline-block">
              <img src="/logo.jpg" alt="Smart Campus Logo" className="w-20 h-20 rounded-[2rem] object-cover" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-semibold text-white/90 mb-10 tracking-wide uppercase"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
            Next-Gen Event Ecosystem
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-white mb-10 max-w-5xl mx-auto leading-[1.1] tracking-tight"
          >
            Smart  <span className="text-secondary italic">Campus</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-16 leading-relaxed font-medium"
          >
            Smart Campus Event Management empowers students and clubs with digital registrations, automated ticketing, and seamless administrative workflows.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8"
          >
            <Link to="/explore" className="bg-white hover:bg-slate-50 text-primary font-bold text-lg px-10 py-5 rounded-full transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-3">
              Explore Events <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/auth/club" className="bg-secondary hover:bg-secondary/90 text-white font-bold text-lg px-10 py-5 rounded-full transition-all shadow-xl hover:scale-105 active:scale-95">
              Host an Event
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};



export default LandingPage;
