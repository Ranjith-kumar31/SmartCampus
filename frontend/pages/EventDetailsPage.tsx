import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Share2, CheckCircle2, CalendarDays, MapPin, UserCheck, Clock, IndianRupee, Tag, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

const categoryColors: Record<string, string> = {
  'AI & ML': 'bg-primary/5 text-primary border-primary/10',
  'Web Development': 'bg-secondary/5 text-secondary border-secondary/10',
  'Cybersecurity': 'bg-red-50 text-red-600 border-red-100',
  'Robotics': 'bg-amber-50 text-amber-600 border-amber-100',
  'Cultural': 'bg-pink-50 text-pink-600 border-pink-100',
  'Sports': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'Hackathon': 'bg-secondary/5 text-secondary border-secondary/10',
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
    if (!user) { 
      toast.error('Identity protocol required. Please sign in to register.'); 
      navigate('/auth/student');
      return; 
    }
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
    <div className="min-h-screen bg-white dark:bg-dark flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary dark:text-secondary animate-spin mx-auto" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading event details...</p>
      </div>
    </div>
  );

  if (error || !event) return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <p className="text-primary font-black text-2xl tracking-tight">{error || 'Event not found'}</p>
        <button onClick={() => navigate(-1)} className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-primary/95 transition-all">
          Go back to Events
        </button>
      </div>
    </div>
  );

  const domainClass = categoryColors[event.domain] || 'bg-slate-50 text-slate-500 border-slate-100';
  const rules = Array.isArray(event.rules) ? event.rules : [];
  const prizes = Array.isArray(event.prizes) ? event.prizes : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark text-slate-800 dark:text-slate-200 pb-32 font-sans">

      {/* Top Nav */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-dark/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-6 py-5 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200 dark:border-slate-700">
          <ChevronLeft className="w-6 h-6 text-primary dark:text-white" />
        </button>
        <h1 className="text-lg font-black text-primary dark:text-white truncate max-w-[60%] tracking-tight">Event Details</h1>
        <button onClick={handleShare} className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all border border-slate-200 dark:border-slate-700">
          <Share2 className="w-5 h-5 text-primary dark:text-white" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-10">

        {/* Hero Section */}
        <div className="relative mb-12">
          <div className="w-full h-64 md:h-80 rounded-[3rem] overflow-hidden relative shadow-2xl shadow-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-slate-800" />
            <img
              src={`https://source.unsplash.com/random/1200x800/?technology,event&sig=${event._id}`}
              alt={event.title}
              className="w-full h-full object-cover opacity-60 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border mb-4 shadow-xl ${domainClass}`}>
                <Tag className="w-3 h-3" /> {event.domain || 'Event'}
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-2 leading-[1.1] tracking-tighter">{event.title}</h2>
              {event.club?.name && (
                <p className="text-white/80 font-bold tracking-tight">Host: {event.club.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <div className="space-y-4">
              <h3 className="text-xl font-black text-primary dark:text-white flex items-center gap-2">
                <div className="w-2 h-8 bg-secondary rounded-full" />
                About the Event
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg leading-relaxed font-medium">
                {event.description || 'No description provided.'}
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: CalendarDays, label: 'Date', value: event.date || 'TBD', color: 'text-primary', bg: 'bg-primary/5' },
                { icon: Clock, label: 'Time', value: event.time || 'TBD', color: 'text-secondary', bg: 'bg-secondary/5' },
                { icon: MapPin, label: 'Venue', value: event.location || 'TBD', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { icon: IndianRupee, label: 'Entry Fee', value: (!event.regFee || event.regFee === 0) ? 'Free' : `₹${event.regFee}`, color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group">
                  <div className={`w-12 h-12 ${bg} dark:bg-opacity-10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                    <Icon className={`w-6 h-6 ${color} dark:text-secondary`} />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mb-1">{label}</p>
                  <p className="text-primary dark:text-white font-black text-lg truncate tracking-tight">{value}</p>
                </div>
              ))}
            </div>

            {/* Rules */}
            {rules.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 md:p-10 shadow-sm">
                <h3 className="text-2xl font-black text-primary dark:text-white mb-8 flex items-center gap-3">
                  <span className="p-3 bg-secondary/10 rounded-2xl text-secondary">⚖️</span>
                  Guidelines
                </h3>
                <ul className="space-y-6">
                  {rules.map((rule: string, idx: number) => (
                    <li key={idx} className="flex gap-4 items-start group">
                      <div className="w-6 h-6 bg-primary/5 dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-md flex items-center justify-center shrink-0 mt-1 font-black text-[10px] text-primary dark:text-secondary">
                        {idx + 1}
                      </div>
                      <span className="text-slate-600 dark:text-slate-400 font-bold leading-relaxed">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-8">
            {/* Prizes Sidebar */}
            {prizes.length > 0 && (
              <div className="bg-primary rounded-[3rem] p-8 text-white shadow-2xl shadow-primary/20">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                  <span className="p-2 bg-white/10 rounded-xl text-yellow-400">🏆</span>
                  Prize Pool
                </h3>
                <div className="space-y-4">
                  {prizes.map((prize: any, idx: number) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/10 group hover:bg-white/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-yellow-400 text-primary' : idx === 1 ? 'bg-slate-300 text-primary' : 'bg-orange-400 text-primary'}`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-black text-sm tracking-tight">{prize.title || (idx === 0 ? 'First' : idx === 1 ? 'Second' : 'Third')}</p>
                          {prize.amount && <p className="text-white font-black text-lg leading-none">₹{prize.amount}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Organizer Card */}
            {event.club?.coordinator && (
              <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
                <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-6">Organizer</h3>
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary to-slate-800 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                    {event.club.coordinator.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-primary font-black text-lg tracking-tight leading-none mb-1">{event.club.coordinator}</p>
                    <p className="text-slate-500 text-xs font-bold">{event.club.name}</p>
                    {event.club.email && <p className="text-secondary text-xs mt-2 font-black underline">{event.club.email}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-white/80 dark:bg-dark/80 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 z-50 flex justify-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-4xl flex items-center justify-between gap-6">
          <div className="hidden md:block">
            <p className="text-primary font-black text-xl leading-none">Registration Status</p>
            <p className="text-slate-400 text-xs font-bold mt-1">Hurry up! Limited slots available.</p>
          </div>
          
          {user?.role === 'student' || !user ? (
            isRegistered ? (
              <div className="w-full md:w-auto md:min-w-[300px] bg-emerald-50 text-emerald-600 font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" /> You are on the list!
              </div>
            ) : (
              <button
                onClick={openRegModal}
                disabled={registering}
                className="w-full md:w-auto md:min-w-[300px] bg-primary hover:bg-primary/95 disabled:opacity-50 active:scale-95 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
              >
                {registering ? <Loader2 className="w-6 h-6 animate-spin" /> : <UserCheck className="w-6 h-6" />}
                {registering ? 'Processing...' : 'Reserve my Spot'}
              </button>
            )
          ) : (
            <div className="bg-slate-50 px-8 py-5 rounded-2xl text-slate-500 font-bold border border-slate-100">
              Only students can register for events.
            </div>
          )}
        </div>
      </div>

      {/* Modern Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/20 backdrop-blur-md"
          onClick={() => setShowRegModal(false)}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-[3rem] w-full max-w-lg p-10 relative shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowRegModal(false)} className="absolute top-8 right-8 p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="mb-10 pt-2">
              <span className="text-secondary font-black text-xs uppercase tracking-widest mb-2 block">Application Form</span>
              <h3 className="text-3xl font-black text-primary leading-tight tracking-tighter">{event.title}</h3>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-slate-400 text-sm font-bold flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> {event.date}</span>
                <span className="text-slate-400 text-sm font-bold flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {event.location}</span>
              </div>
            </div>

            <div className="space-y-8">
              {/* Profile Context */}
              <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 grid grid-cols-2 gap-y-4 gap-x-6">
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Student Name</p>
                   <p className="text-primary font-black text-sm tracking-tight">{user?.name}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Roll Number</p>
                   <p className="text-primary font-black text-sm tracking-tight">{user?.rollNumber || 'N/A'}</p>
                 </div>
                 <div className="col-span-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Email Address</p>
                   <p className="text-primary font-black text-sm tracking-tight truncate">{user?.email}</p>
                 </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black text-primary uppercase tracking-widest mb-3 block">Primary Phone Number</label>
                  <input 
                    type="tel" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-primary font-black text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-slate-300"
                    placeholder="e.g. 9876543210"
                    value={regForm.phone} 
                    onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-black text-primary uppercase tracking-widest mb-3 block">Year of Study</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-primary font-black text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all appearance-none cursor-pointer"
                      value={regForm.year} 
                      onChange={e => setRegForm(p => ({ ...p, year: e.target.value }))}
                    >
                      <option value="">Select Year</option>
                      {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-primary uppercase tracking-widest mb-3 block">Branch / Section</label>
                    <input 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-primary font-black text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-slate-300"
                      placeholder="e.g. CSE-A"
                      value={regForm.branch} 
                      onChange={e => setRegForm(p => ({ ...p, branch: e.target.value }))} 
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowRegModal(false)}
                    className="flex-1 py-4 text-slate-400 hover:text-primary font-black text-sm rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all"
                  >
                    Discard
                  </button>
                  <button 
                    onClick={submitRegistration} 
                    disabled={registering}
                    className="flex-2 px-10 py-4 bg-primary hover:bg-primary/95 disabled:opacity-50 text-white font-black text-sm rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
                  >
                    {registering ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    Confirm Application
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EventDetailsPage;
