import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Share2, CheckCircle2, CalendarDays, MapPin, UserCheck, Clock, Users, IndianRupee, Tag, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

const categoryColors: Record<string, string> = {
  'AI & ML': 'bg-indigo-600/20 text-indigo-400 border-indigo-500/20',
  'Web Development': 'bg-cyan-600/20 text-cyan-400 border-cyan-500/20',
  'Cybersecurity': 'bg-red-600/20 text-red-400 border-red-500/20',
  'Robotics': 'bg-amber-600/20 text-amber-400 border-amber-500/20',
  'Cultural': 'bg-pink-600/20 text-pink-400 border-pink-500/20',
  'Sports': 'bg-emerald-600/20 text-emerald-400 border-emerald-500/20',
  'Hackathon': 'bg-violet-600/20 text-violet-400 border-violet-500/20',
};

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Registration form modal state
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ phone: '', year: '', branch: '' });

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    fetchEvent();
    if (user?.id) checkRegistration();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      // Try fetching by ID from approved events list
      const res = await api.get(`/events`);
      const found = res.data.find((e: any) => e.id === id || e._id === id);
      if (!found) {
        setError('Event not found or not yet approved.');
      } else {
        setEvent(found);
      }
    } catch {
      setError('Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    try {
      const res = await api.get(`/events/student/${user.id}/registered`);
      const registered = res.data.some((e: any) => e.id === id || e._id === id);
      setIsRegistered(registered);
    } catch { /* silent */ }
  };

  const openRegModal = () => {
    if (!user) { toast.error('Please log in to register for events'); return; }
    setRegForm({ phone: '', year: '', branch: user.department || '' });
    setShowRegModal(true);
  };

  const submitRegistration = async () => {
    if (!regForm.phone.trim() || !regForm.year.trim()) {
      toast.error('Please fill in your phone number and year of study');
      return;
    }
    setRegistering(true);
    try {
      const eventId = event.id || event._id;
      const res = await api.post(`/events/${eventId}/register`, {
        studentId: user.id,
        phone: regForm.phone,
        year: regForm.year,
        branch: regForm.branch,
      });
      toast.success(res.data.message || 'Registered successfully! 🎉');
      setIsRegistered(true);
      setShowRegModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: event?.title, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#080b14] flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
        <p className="text-slate-500">Loading event details...</p>
      </div>
    </div>
  );

  if (error || !event) return (
    <div className="min-h-screen bg-[#080b14] flex items-center justify-center px-6">
      <div className="text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <p className="text-white font-bold text-lg">{error || 'Event not found'}</p>
        <button onClick={() => navigate(-1)} className="text-indigo-400 hover:underline text-sm">Go back</button>
      </div>
    </div>
  );

  const domainClass = categoryColors[event.domain] || 'bg-slate-600/20 text-slate-400 border-slate-500/20';
  const rules = Array.isArray(event.rules) ? event.rules : [];
  const prizes = Array.isArray(event.prizes) ? event.prizes : [];

  return (
    <div className="min-h-screen bg-[#080b14] text-slate-200 pb-28 font-sans">

      {/* Top Nav */}
      <div className="sticky top-0 z-50 bg-[#080b14]/90 backdrop-blur-xl border-b border-white/[0.04] px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/[0.06] rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-base font-bold text-white truncate max-w-[60%]">{event.title}</h1>
        <button onClick={handleShare} className="p-2 hover:bg-white/[0.06] rounded-full transition-colors">
          <Share2 className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="max-w-3xl mx-auto">

        {/* Hero Banner */}
        <div className="w-full h-56 md:h-72 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-violet-900/30 to-[#080b14]" />
          <div className="absolute inset-0 opacity-20 mix-blend-screen"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(99,102,241,0.6), transparent 60%), radial-gradient(circle at 80% 50%, rgba(139,92,246,0.4), transparent 60%)' }} />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#080b14] to-transparent z-10" />
          <div className="absolute inset-0 flex items-center justify-center z-5">
            <span className="text-8xl md:text-9xl font-black text-white/[0.03] uppercase tracking-tighter select-none">
              {event.domain || 'EVENT'}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-5 md:px-8 -mt-6 relative z-20 space-y-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border mb-3 ${domainClass}`}>
              <Tag className="w-3 h-3" /> {event.domain || 'Event'}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">{event.title}</h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">{event.description || 'No description provided.'}</p>

            {/* Organized by */}
            {event.club?.name && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-slate-500 text-xs">Organized by</span>
                <span className="text-indigo-400 text-xs font-bold">{event.club.name}</span>
              </div>
            )}
          </motion.div>

          {/* Quick Stats Row */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: CalendarDays, label: 'Date', value: event.date || 'TBD', color: 'text-indigo-400' },
              { icon: Clock, label: 'Time', value: event.time || 'TBD', color: 'text-violet-400' },
              { icon: MapPin, label: 'Venue', value: event.location || 'TBD', color: 'text-emerald-400' },
              { icon: IndianRupee, label: 'Entry Fee', value: (!event.regFee || event.regFee === 0) ? 'Free' : `₹${event.regFee}`, color: (!event.regFee || event.regFee === 0) ? 'text-emerald-400' : 'text-amber-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 md:p-4">
                <Icon className={`w-4 h-4 ${color} mb-1.5`} />
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">{label}</p>
                <p className="text-white text-xs font-semibold truncate">{value}</p>
              </div>
            ))}
          </motion.div>

          {/* Expected Audience */}
          {event.expectedAudience && (
            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
              <Users className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Expected Audience</p>
                <p className="text-white font-semibold">{event.expectedAudience} participants</p>
              </div>
            </div>
          )}

          {/* Rules */}
          {rules.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 md:p-6 space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <span className="text-indigo-400">⚖️</span> Rules & Guidelines
              </h3>
              <ul className="space-y-3">
                {rules.map((rule: string, idx: number) => (
                  <li key={idx} className="flex gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">{rule}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Prizes */}
          {prizes.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 md:p-6">
              <h3 className="text-white font-bold flex items-center gap-2 mb-5">
                <span className="text-emerald-400">🏆</span> Prizes & Rewards
              </h3>
              <div className="space-y-3">
                {prizes.map((prize: any, idx: number) => (
                  <div key={idx} className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3 md:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-500' : 'bg-orange-700'}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${idx === 0 ? 'text-amber-400' : 'text-white'}`}>
                          {prize.title || `${idx + 1}${idx === 0 ? 'st' : idx === 1 ? 'nd' : 'rd'} Prize`}
                        </p>
                        {prize.description && <p className="text-slate-500 text-xs">{prize.description}</p>}
                      </div>
                    </div>
                    {prize.amount && <span className="text-white font-bold">₹{prize.amount}</span>}
                  </div>
                ))}
                <div className="pt-3 mt-1 border-t border-white/[0.04] text-xs text-slate-500">
                  🏅 Participation certificates for all registered attendees.
                </div>
              </div>
            </motion.div>
          )}

          {/* Club Coordinator Info */}
          {event.club?.coordinator && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4">📋 Organizer Details</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {event.club.coordinator.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold">{event.club.coordinator}</p>
                  <p className="text-slate-500 text-sm">{event.club.name}</p>
                  {event.club.email && <p className="text-indigo-400 text-xs mt-0.5">{event.club.email}</p>}
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* Sticky Bottom Register Bar */}
      <div className="fixed bottom-0 left-0 w-full p-4 md:p-6 bg-[#080b14]/95 backdrop-blur-xl border-t border-white/[0.06] z-50 flex justify-center">
        {user?.role === 'student' || !user ? (
          isRegistered ? (
            <div className="w-full max-w-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> You're Registered!
            </div>
          ) : (
            <button
              onClick={openRegModal}
              disabled={registering}
              className="w-full max-w-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 active:scale-95 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
            >
              {registering ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserCheck className="w-5 h-5" />}
              {registering ? 'Registering...' : 'Register Now'}
            </button>
          )
        ) : (
          <div className="text-slate-500 text-sm">Registration is for students only.</div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowRegModal(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0c1021] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 relative shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowRegModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>

            <div className="mb-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1 block">Event Registration</span>
              <h3 className="text-lg font-bold text-white">{event.title}</h3>
              <p className="text-slate-500 text-xs mt-1">{event.date} · {event.location}</p>
            </div>

            {/* Auto-filled student info */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Your Details (auto-filled)</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-500 text-[10px] uppercase">Name</p><p className="text-white font-medium">{user?.name}</p></div>
                <div><p className="text-slate-500 text-[10px] uppercase">Roll No</p><p className="text-white font-medium">{user?.rollNumber || 'N/A'}</p></div>
                <div><p className="text-slate-500 text-[10px] uppercase">Department</p><p className="text-white font-medium">{user?.department}</p></div>
                <div><p className="text-slate-500 text-[10px] uppercase">Email</p><p className="text-white font-medium text-xs truncate">{user?.email}</p></div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Additional Details Required</p>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input type="tel" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500/50 placeholder-slate-600"
                  placeholder="e.g. 9876543210"
                  value={regForm.phone} onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Year of Study <span className="text-red-400">*</span>
                  </label>
                  <select className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500/50"
                    value={regForm.year} onChange={e => setRegForm(p => ({ ...p, year: e.target.value }))}>
                    <option value="" className="bg-[#0c1021]">Select Year</option>
                    {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => (
                      <option key={y} value={y} className="bg-[#0c1021]">{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Branch / Section</label>
                  <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500/50 placeholder-slate-600"
                    placeholder="e.g. CSE-A"
                    value={regForm.branch} onChange={e => setRegForm(p => ({ ...p, branch: e.target.value }))} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowRegModal(false)} className="flex-1 py-3 text-slate-400 hover:text-white text-sm font-medium border border-white/[0.06] rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={submitRegistration} disabled={registering}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm Registration
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EventDetailsPage;
