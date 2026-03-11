import { motion } from 'framer-motion';
import { Ticket, CheckCircle, Target, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 blur-[120px] rounded-full -z-10 mix-blend-screen" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-600/15 blur-[120px] rounded-full -z-10 mix-blend-screen" />

        <div className="container mx-auto px-6 md:px-12 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="w-24 h-24 mx-auto rounded-3xl shadow-2xl shadow-indigo-600/30 border border-white/10 flex items-center justify-center overflow-hidden">
              <img src="/logo.jpg" alt="Smart Campus Logo" className="w-full h-full object-cover" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm text-sm font-medium text-slate-400 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="ml-1">Next-Gen Event Management</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 mb-8 max-w-4xl mx-auto leading-tight"
          >
            Campus events, <span className="text-indigo-400 italic">redefined.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12"
          >
            Discover, register, and manage campus events seamlessly. Complete with automated OD requests, QR ticketing, and comprehensive club analytics.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to="/auth/student" className="btn-primary flex items-center gap-2 group text-lg px-8 py-4">
              Explore Events <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/auth/club" className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
              Host an Event
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-24 relative bg-surface/30">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Everything you need to orchestrate the perfect campus experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Ticket className="w-8 h-8 text-indigo-400" />}
              title="Smart QR Ticketing"
              desc="Instant digital tickets upon registration. Clubs can scan these at the venue for automated check-in & check-out logs."
            />
            <FeatureCard
              icon={<CheckCircle className="w-8 h-8 text-violet-400" />}
              title="Automated OD Workflow"
              desc="Students request On-Duty leaves, HODs approve them digitally. Goodbye paper forms, hello efficiency."
            />
            <FeatureCard
              icon={<Target className="w-8 h-8 text-amber-400" />}
              title="Advanced Analytics"
              desc="Deep insights into event demographics, registration velocity, and historical trends for clubs and HODs."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="dashboard-card p-8 group hover:border-indigo-500/20"
    >
      <div className="bg-white/[0.03] w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-black/20 border border-white/[0.06]">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </motion.div>
  );
};

export default LandingPage;
