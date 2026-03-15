import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Ticket, FileCheck, User, Settings, CalendarDays, MapPin, Clock, Send, X, CheckCircle, XCircle, ChevronRight, Sparkles, Brain, TrendingUp, BadgeCheck, Zap, History } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

const navItems = [
  { icon: Home, label: 'Home', id: 'events' },
  { icon: Sparkles, label: 'AI Suggestions', id: 'ai' },
  { icon: Ticket, label: 'My Tickets', id: 'tickets' },
  { icon: FileCheck, label: 'OD Requests', id: 'od' },
  { icon: User, label: 'Profile', id: 'profile' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
  const [odRequests, setOdRequests] = useState<any[]>([]);
  const [odLoading, setOdLoading] = useState(false);
  const [showOdModal, setShowOdModal] = useState(false);
  const [odReason, setOdReason] = useState('');
  const [selectedEventForOd, setSelectedEventForOd] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Registration form modal state
  const [showRegModal, setShowRegModal] = useState(false);
  const [regEventTarget, setRegEventTarget] = useState<any>(null);
  const [regForm, setRegForm] = useState({ phone: '', year: '', branch: '' });
  const [regLoading, setRegLoading] = useState(false);

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { name: 'Student', department: 'Unknown', id: '', rollNumber: '' };

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  // Fetch real registered events for this student
  const fetchRegisteredEvents = async () => {
    if (!user.id) return;
    try {
      const res = await api.get(`/events/student/${user.id}/registered`);
      setRegisteredEvents(res.data || []);
    } catch { console.error('Failed to fetch registered events'); }
  };

  const fetchOdRequests = async () => {
    if (!user.id) return;
    setOdLoading(true);
    try {
      const res = await api.get(`/od/student/${user.id}`);
      setOdRequests(res.data);
    } catch { console.error('Failed to load OD requests'); }
    finally { setOdLoading(false); }
  };

  useEffect(() => { fetchEvents(); fetchRegisteredEvents(); fetchOdRequests(); }, []);

  const fetchAiSuggestions = async () => {
    if (!user.id || aiSuggestions) return; // Only fetch once
    setAiLoading(true);
    try {
      const res = await api.get(`/ai/suggestions/${user.id}`);
      setAiSuggestions(res.data);
    } catch { toast.error('Could not load AI suggestions'); }
    finally { setAiLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'ai') fetchAiSuggestions();
  }, [activeTab]);

  // Open registration form modal (always collect details)
  const openRegModal = (event: any) => {
    setRegEventTarget(event);
    setRegForm({
      phone: '',
      year: '',
      branch: user.department || '',
    });
    setShowRegModal(true);
  };

  // Submit registration with details
  const submitRegistration = async () => {
    if (!regEventTarget) return;
    if (!regForm.phone.trim() || !regForm.year.trim()) {
      toast.error('Please fill in your phone number and year of study');
      return;
    }
    setRegLoading(true);
    const eventId = regEventTarget.id || regEventTarget._id;
    const regFee = regEventTarget.regFee || regEventTarget.reg_fee || 0;

    try {
      if (!regFee || regFee === 0) {
        // Free event — direct registration with details
        const res = await api.post(`/events/${eventId}/register`, {
          studentId: user.id,
          phone: regForm.phone,
          year: regForm.year,
          branch: regForm.branch,
        });
        toast.success(res.data.message || 'Registered successfully! 🎉');
        setShowRegModal(false);
        fetchEvents();
        fetchRegisteredEvents();
        setAiSuggestions(null);
      } else {
        setShowRegModal(false);
        // Paid event — keep existing Razorpay flow
        await handleRegister(eventId, regFee);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register');
    } finally {
      setRegLoading(false);
    }
  };


  // Paid event — Razorpay checkout (called from submitRegistration for paid events)
  const handleRegister = async (eventId: string, regFee: number = 0) => {
    if (!regFee || regFee === 0) return;
    try {
      const orderRes = await api.post('/payments/create-order', { eventId, studentId: user.id });
      const { orderId, amount, currency, keyId, eventTitle } = orderRes.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Smart Campus Events',
        description: `Registration for ${eventTitle}`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              eventId,
              studentId: user.id,
            });
            toast.success('Payment successful! Registration confirmed 🎉');
            fetchEvents();
            fetchRegisteredEvents();
            setAiSuggestions(null);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: { name: user.name, email: user.email || '' },
        theme: { color: '#6366f1' },
        modal: { ondismiss: () => toast('Payment cancelled.', { icon: '⚠️' }) },
      };

      if (!(window as any).Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => { const rzp = new (window as any).Razorpay(options); rzp.open(); };
        document.body.appendChild(script);
      } else {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
    }
  };

  const handleOdSubmit = async () => {
    if (!selectedEventForOd || !odReason.trim()) { toast.error('Please select an event and provide a reason'); return; }
    try {
      await api.post('/od', { studentId: user.id, eventId: selectedEventForOd, reason: odReason });
      toast.success('OD Request submitted!');
      setShowOdModal(false); setOdReason(''); setSelectedEventForOd('');
      fetchOdRequests();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to submit OD request'); }
  };


  // Set of registered event IDs for O(1) lookup
  const registeredEventIds = new Set(registeredEvents.map(e => e.id || e._id));

const categoryColors: Record<string, string> = {
  'AI & ML': 'bg-primary',
  'AI & DS': 'bg-secondary',
  'Web Development': 'bg-cyan-500',
  'Cybersecurity': 'bg-rose-500',
  'Robotics': 'bg-amber-500',
  'Cultural': 'bg-pink-500',
  'Sports': 'bg-emerald-500',
  'General': 'bg-slate-600',
  'Technology': 'bg-primary',
  'Design': 'bg-secondary',
  'Music': 'bg-purple-500',
};

  return (
    <DashboardLayout
      title={`Welcome back, ${user.name}!`}
      navItems={navItems}
      activeView={activeTab}
      onViewChange={setActiveTab}
      userName={user.name || 'Student'}
      userRole="Student"
      userId={user.rollNumber || user.id}
      searchPlaceholder="Search events, tickets, or OD status..."
      bottomWidget="support"
    >
      <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        {/* ===== AI SUGGESTIONS ===== */}
        {activeTab === 'ai' && (
          <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-700 flex items-center justify-center shadow-2xl shadow-primary/20">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-primary font-black text-2xl tracking-tight">Smart Career Path</h2>
                <p className="text-slate-500 font-medium">Personalized opportunities discovered by our AI Engine</p>
              </div>
            </div>

            {aiLoading ? (
              <div className="dashboard-card p-20 flex flex-col items-center gap-6 border-none shadow-none bg-transparent">
                <div className="w-16 h-16 rounded-3xl border-4 border-slate-100 border-t-primary animate-spin" />
                <p className="text-slate-500 font-black animate-pulse">Analyzing your activity landscape...</p>
              </div>
            ) : aiSuggestions ? (
              <>
                {/* Insight Banner */}
                <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Brain className="w-32 h-32 text-primary" />
                  </div>
                  <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shrink-0 shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-primary font-black text-xs uppercase tracking-[0.2em] mb-2 leading-none">Global Growth Insight</p>
                    <p className="text-slate-700 text-lg font-bold leading-tight">{aiSuggestions.insight}</p>
                  </div>
                  <div className="text-center md:text-right shrink-0 bg-white px-8 py-4 rounded-3xl border border-primary/5 shadow-sm">
                    <div className="text-3xl font-black text-primary leading-none mb-1">{aiSuggestions.totalRegistered}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Registrations</div>
                  </div>
                </div>

                {/* OD Approval Rate */}
                <div className="dashboard-card p-8 border-slate-100 rounded-[2.5rem]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                         <TrendingUp className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-primary font-black tracking-tight">OD Success Probability</span>
                    </div>
                    <span className={`text-3xl font-black tracking-tighter ${aiSuggestions.odApprovalRate >= 70 ? 'text-emerald-500' : aiSuggestions.odApprovalRate >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                      {aiSuggestions.odApprovalRate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-50 rounded-full h-4 overflow-hidden p-1 border border-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${aiSuggestions.odApprovalRate}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${aiSuggestions.odApprovalRate >= 70 ? 'bg-emerald-500' : aiSuggestions.odApprovalRate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                    />
                  </div>
                  <div className="flex gap-2 mt-4 items-center">
                    <div className={`w-2 h-2 rounded-full ${aiSuggestions.odApprovalRate >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <p className="text-slate-500 text-sm font-bold">
                      {aiSuggestions.odApprovalRate >= 70 ? 'HOD is favorable towards current event domains.' :
                       aiSuggestions.odApprovalRate >= 40 ? 'Moderate approval probability. Keep your reason concise.' :
                       'Current department policy is tight. Ensure your OD reason is critical.'}
                    </p>
                  </div>
                </div>

                {/* Recommendation Cards */}
                <div>
                  <h3 className="text-primary font-black text-xl mb-6 flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> 
                    Tailored Opportunities
                  </h3>
                  <div className="space-y-6">
                    {aiSuggestions.recommendations.length === 0 ? (
                      <div className="dashboard-card p-20 text-center rounded-[3rem] border-dashed border-2">
                        <p className="text-6xl mb-6 opacity-30">🎯</p>
                        <p className="font-black text-primary text-xl">Perfect Alignment!</p>
                        <p className="text-slate-500 font-medium mt-2">You've reached peak engagement. Stay tuned for new alerts.</p>
                      </div>
                    ) : aiSuggestions.recommendations.map((item: any, i: number) => (
                      <motion.div
                        key={item.event._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="dashboard-card p-8 group hover:scale-[1.01] border-slate-100 hover:border-primary/20 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-primary/5"
                      >
                        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <h4 className="text-primary font-black text-2xl tracking-tight leading-none group-hover:text-primary transition-colors">{item.event.title}</h4>
                              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                item.matchColor === 'emerald' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                item.matchColor === 'indigo' ? 'bg-primary/5 text-primary border border-primary/10' :
                                item.matchColor === 'amber' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                              }`}>{item.matchLabel}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-400 text-xs font-bold font-mono">
                               <span>{item.event.club?.name}</span>
                               <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                               <span>{item.event.domain}</span>
                            </div>
                          </div>
                          <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10 text-center min-w-[100px] shrink-0">
                            <div className="text-3xl font-black text-primary tracking-tighter leading-none">{item.score}</div>
                            <div className="text-[10px] text-primary/40 font-black uppercase tracking-widest mt-1">AI SCORE</div>
                          </div>
                        </div>

                        {/* Top Reason Highlight */}
                        <div className="flex items-start gap-4 bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                             <BadgeCheck className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                             <p className="text-primary font-black text-sm mb-1 leading-none">Why we picked this:</p>
                             <p className="text-slate-500 text-sm font-medium leading-tight">{item.topReason}</p>
                          </div>
                        </div>

                        {/* Reason pills */}
                        <div className="flex flex-wrap gap-2 mb-8">
                          {item.reasons.slice(1).map((r: string, ri: number) => (
                            <span key={ri} className="text-[10px] px-3 py-1.5 bg-white text-slate-400 font-bold border border-slate-100 rounded-lg shadow-sm">{r}</span>
                          ))}
                        </div>

                        {/* Event details row */}
                        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 font-bold mb-8">
                          <span className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" />{item.event.date}</span>
                          <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />{item.event.location}</span>
                          <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                            {item.event.regFee === 0 ? '🆓 FREE ENTRY' : `₹${item.event.regFee}`}
                          </span>
                          <span className={`ml-auto font-black px-4 py-1.5 rounded-2xl border ${
                            item.odProbability >= 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            item.odProbability >= 40 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                          }`}>OD PROBABILITY: {item.odProbability}%</span>
                        </div>

                        <button
                          onClick={() => handleRegister(item.event._id)}
                          className="w-full py-5 bg-primary hover:bg-slate-800 text-white text-base font-black rounded-3xl transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98]"
                        >
                          Confirm Participation
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="dashboard-card p-20 text-center rounded-[3rem]">
                <div className="w-24 h-24 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                   <p className="text-5xl">🤖</p>
                </div>
                <h3 className="text-primary font-black text-2xl mb-2">Initialize Your Insights</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">Click below to generate personalized event trajectories based on your profile.</p>
                <button onClick={fetchAiSuggestions} className="px-10 py-4 bg-primary hover:bg-slate-800 text-white text-base font-black rounded-[2rem] transition-all shadow-xl shadow-primary/20">
                  Generate My Suggestions
                </button>
              </div>
            )}
          </div>
        )}

        
        {/* ===== EVENTS TAB ===== */}
        {activeTab === 'events' && (
          <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-primary font-black text-2xl tracking-tight">Upcoming Events</h2>
                <p className="text-slate-500 font-medium">Discover and participate in college activities</p>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sort:</span>
                 <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option>Newest First</option>
                    <option>Date Ascending</option>
                 </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="dashboard-card h-64 animate-pulse bg-slate-50 border-none" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="dashboard-card p-20 text-center rounded-[3rem]">
                <div className="text-6xl mb-4 opacity-20">📅</div>
                <h3 className="text-primary font-black text-xl">No active events yet</h3>
                <p className="text-slate-500 font-medium mt-2">Check back soon for new opportunities!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event: any, i: number) => {
                  const eId = event.id || event._id;
                  const isRegistered = registeredEventIds.has(eId);
                  return (
                    <motion.div
                      key={eId}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="dashboard-card flex flex-col group overflow-hidden border-slate-100 hover:border-primary/20 rounded-[2rem] shadow-sm hover:shadow-xl transition-all"
                    >
                      {/* Card Banner */}
                      <div className={`h-24 ${categoryColors[event.domain] || 'bg-slate-600'} relative overflow-hidden group-hover:h-28 transition-all duration-500`}>
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 text-[10px] text-white font-black uppercase tracking-widest">
                           {event.domain}
                        </div>
                      </div>

                      <div className="p-6 flex flex-col flex-1 mt-[-40px]">
                        <div className="bg-white p-5 rounded-3xl shadow-lg shadow-black/5 mb-4 group-hover:translate-y-[-4px] transition-transform">
                          <h3 className="text-primary font-black text-lg leading-tight line-clamp-2">{event.title}</h3>
                          <div className="flex items-center gap-2 mt-2">
                             <span className="w-2 h-2 rounded-full bg-emerald-500" />
                             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{event.club?.name || 'Smart Campus Club'}</p>
                          </div>
                        </div>

                        <div className="space-y-3 mb-6 font-medium">
                          <div className="flex items-center gap-3 text-slate-500 text-sm">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                               <CalendarDays className="w-4 h-4 text-primary" />
                            </div>
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-500 text-sm">
                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                               <MapPin className="w-4 h-4 text-primary" />
                            </div>
                            <span className="truncate">{event.location?.split(',')[0]}</span>
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                           <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Fee</p>
                              <p className="text-sm font-black text-primary leading-none">
                                {event.regFee === 0 ? 'FREE' : `₹${event.regFee}`}
                              </p>
                           </div>
                           <button
                             onClick={() => navigate(`/event/${eId}`)}
                             className={`flex-1 py-3 text-sm font-black rounded-2xl transition-all ${
                               isRegistered 
                               ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                               : 'bg-primary text-white hover:bg-slate-800 shadow-lg shadow-primary/20 transition-all active:scale-95'
                             }`}
                           >
                             {isRegistered ? 'Registered ✅' : 'View Pass →'}
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== TICKETS TAB ===== */}
        {activeTab === 'tickets' && (
          <div className="space-y-8 pb-10">
            <div>
              <h2 className="text-primary font-black text-2xl tracking-tight">My Active Passes</h2>
              <p className="text-slate-500 font-medium">Your secured entry tickets for upcoming events</p>
            </div>
            {registeredEvents.length === 0 ? (
              <div className="dashboard-card p-20 text-center rounded-[3rem]">
                <div className="text-6xl mb-4">🎟️</div>
                <h3 className="text-primary font-black text-xl">No active passes</h3>
                <p className="text-slate-500 font-medium mt-2">Register for an event to see your QR pass here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {registeredEvents.map(event => (
                  <TicketCardCompact key={event.id || event._id} event={event} userId={user.id} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== OD TAB ===== */}
        {activeTab === 'od' && (
          <div className="space-y-8 pb-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-primary font-black text-2xl tracking-tight">OD Request History</h2>
                <p className="text-slate-500 font-medium">Status of your On-Duty applications</p>
              </div>
              <button 
                onClick={() => setShowOdModal(true)}
                className="bg-primary hover:bg-slate-800 text-white font-black px-6 py-3 rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> New Request
              </button>
            </div>
            <div className="dashboard-card overflow-hidden rounded-[2.5rem] border-slate-100 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-slate-400">Event Name</th>
                    <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-slate-400">Date Applied</th>
                    <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-slate-400">Reason</th>
                    <th className="px-8 py-5 text-[10px] uppercase font-black tracking-widest text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {odLoading ? (
                    <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 font-bold">Synchronizing data...</td></tr>
                  ) : odRequests.length === 0 ? (
                    <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 font-bold">No requests found.</td></tr>
                  ) : (
                    odRequests.map((req: any) => (
                      <tr key={req._id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-8 py-6 font-black text-primary">{req.event?.title || 'External Event'}</td>
                        <td className="px-8 py-6 text-slate-500 font-bold">{new Date(req.createdAt).toLocaleDateString()}</td>
                        <td className="px-8 py-6 text-slate-400 font-medium max-w-[200px] truncate">{req.reason}</td>
                        <td className="px-8 py-6"><StatusBadge status={req.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== OD TAB ===== */}
        {activeTab === 'od' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">OD Request History</h2>
              <button onClick={() => setShowOdModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
                <Send className="w-4 h-4" /> New Request
              </button>
            </div>
            <div className="dashboard-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Event Name</th>
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Date</th>
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Reason</th>
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {odLoading ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
                  ) : odRequests.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No OD requests yet.</td></tr>
                  ) : (
                    odRequests.map((req: any) => (
                      <tr key={req._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-medium text-white">{req.event?.title || 'N/A'}</td>
                        <td className="px-5 py-3.5 text-slate-400">{req.event?.date || 'N/A'}</td>
                        <td className="px-5 py-3.5 text-slate-400 max-w-[200px] truncate">{req.reason}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={req.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (() => {
          const today = new Date().toISOString().split('T')[0];
          const upcomingEvents = registeredEvents.filter(e => (e.date || e.event?.date) >= today);
          const pastEvents = registeredEvents.filter(e => (e.date || e.event?.date) < today);
          const approvedOds = odRequests.filter(r => r.status === 'Approved').length;

          return (
            <div className="space-y-8 pb-10">
              <h2 className="text-primary font-black text-2xl tracking-tight">Academic Identity</h2>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="dashboard-card p-10 text-center rounded-[3rem] border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary opacity-50" />
                    <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-black/5 group-hover:scale-105 transition-transform">
                      <span className="text-5xl font-black text-primary">{user.name?.charAt(0)}</span>
                    </div>
                    <h3 className="text-primary text-2xl font-black tracking-tight">{user.name}</h3>
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mt-2 mb-8 leading-none">Verified Student</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Passes</p>
                        <p className="text-xl font-black text-primary">{registeredEvents.length}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">OD Count</p>
                        <p className="text-xl font-black text-emerald-600">{approvedOds}</p>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card p-8 rounded-[2rem] border-slate-100">
                     <h4 className="text-primary font-black text-xs uppercase tracking-widest mb-6">Social Credibility</h4>
                     <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-400 text-sm font-bold">Contribution Score</span>
                        <span className="text-primary font-black text-lg">942</span>
                     </div>
                     <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                        <div className="w-[85%] h-full bg-primary" />
                     </div>
                  </div>
                </div>

                {/* Data Grid */}
                <div className="lg:col-span-8 space-y-8">
                  <div className="dashboard-card p-8 rounded-[2.5rem] border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-x-10">
                    <ProfileInfoItem label="Department" value={user.department} icon="🏢" />
                    <ProfileInfoItem label="University ID" value={user.rollNumber} icon="🆔" />
                    <ProfileInfoItem label="Academic Phase" value="3rd Year (B.Tech)" icon="🎓" />
                    <ProfileInfoItem label="Primary Email" value={user.email} icon="✉️" />
                  </div>

                  {/* Upcoming vs Past Tabs inside profile */}
                  <div className="dashboard-card overflow-hidden rounded-[2.5rem] border-slate-100">
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                       <h3 className="text-primary font-black text-sm uppercase tracking-widest">Recent Activity</h3>
                       <div className="flex gap-4">
                          <span className="text-xs font-bold text-slate-400">Total: {registeredEvents.length}</span>
                       </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-medium">No participation records yet.</div>
                      ) : (
                        [...upcomingEvents, ...pastEvents].slice(0, 5).map((event: any) => (
                          <div key={event._id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-5">
                              <div className={`w-12 h-12 rounded-2xl ${categoryColors[event.domain] || 'bg-slate-100'} flex items-center justify-center text-white font-black text-lg shadow-sm`}>
                                {(event.title || event.event?.title)?.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-primary font-black text-sm">{event.title || event.event?.title}</h4>
                                <p className="text-slate-400 text-xs font-bold mt-0.5">{event.date || event.event?.date}</p>
                              </div>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              (event.date || event.event?.date) >= today ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {(event.date || event.event?.date) >= today ? 'Upcoming' : 'Completed'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ===== SETTINGS TAB ===== */}
        {activeTab === 'settings' && (
          <div className="pb-10">
            <h2 className="text-primary font-black text-2xl tracking-tight mb-8">System Preferences</h2>
            <div className="dashboard-card p-20 text-center rounded-[3rem] border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                 <Settings className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-primary font-black text-xl">Module Under Maintenance</h3>
              <p className="text-slate-500 font-medium mt-2">Enhanced preference controls are coming in the next update.</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ===== OD MODAL ===== */}
      <AnimatePresence>
        {showOdModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl"
            onClick={() => setShowOdModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden" 
              onClick={(e) => e.stopPropagation()}>
              
              <div className="h-2 w-full bg-primary" />
              <button onClick={() => setShowOdModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-primary transition-colors">
                <XCircle className="w-8 h-8" />
              </button>

              <div className="p-10">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl">
                      <FileCheck className="w-8 h-8" />
                   </div>
                   <div>
                      <h3 className="text-primary text-2xl font-black tracking-tight">OD Application</h3>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Academic Leave Request</p>
                   </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Validated Event</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all appearance-none" 
                      value={selectedEventForOd} onChange={(e) => setSelectedEventForOd(e.target.value)}>
                      <option value="" disabled>Choose from your registrations</option>
                      {registeredEvents.map((ev: any) => (
                        <option key={ev._id} value={ev._id}>{(ev.title || ev.event?.title)} — {(ev.date || ev.event?.date)}</option>
                      ))}
                    </select>
                    {registeredEvents.length === 0 && <p className="text-[10px] text-rose-500 mt-2 font-bold">⚠️ No valid registrations found to claim OD.</p>}
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Context / Reason</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none h-32" 
                      placeholder="Explain your participation role..."
                      value={odReason} onChange={(e) => setOdReason(e.target.value)} />
                  </div>

                  <button onClick={handleOdSubmit} disabled={!selectedEventForOd || !odReason || odLoading}
                    className="w-full bg-primary hover:bg-slate-800 disabled:opacity-50 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3">
                    {odLoading ? <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                    Transmit Request
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== REGISTRATION FORM MODAL ===== */}
      <AnimatePresence>
        {showRegModal && regEventTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl"
            onClick={() => setShowRegModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden" 
              onClick={e => e.stopPropagation()}>
              
              <div className={`h-2 w-full ${categoryColors[regEventTarget.domain] || 'bg-primary'}`} />
              <button onClick={() => setShowRegModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-primary transition-colors">
                <XCircle className="w-8 h-8" />
              </button>

              <div className="p-10">
                <div className="mb-8">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 mb-2 block">Secure Registration</span>
                  <h3 className="text-2xl font-black text-primary tracking-tight leading-tight">{regEventTarget.title}</h3>
                  <div className="flex items-center gap-4 mt-3">
                     <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> {regEventTarget.date}</span>
                     <span className="text-slate-400 text-xs font-bold flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {regEventTarget.location?.split(',')[0]}</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 mb-8 grid grid-cols-2 gap-y-4 gap-x-6">
                   <div className="col-span-2 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-[-8px]">Identity Sync</div>
                   <div><p className="text-[10px] text-slate-400 font-bold uppercase">Name</p><p className="text-primary text-sm font-black truncate">{user.name}</p></div>
                   <div><p className="text-[10px] text-slate-400 font-bold uppercase">Roll No</p><p className="text-primary text-sm font-black">{user.rollNumber || 'VERIFYING'}</p></div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Contact Primary <span className="text-rose-500">*</span></label>
                    <input type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" 
                      placeholder="e.g. 9876543210" value={regForm.phone} onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Academic Year <span className="text-rose-500">*</span></label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" 
                        value={regForm.year} onChange={e => setRegForm(p => ({ ...p, year: e.target.value }))}>
                        <option value="">Select</option>
                        {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Section</label>
                      <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" 
                        placeholder="e.g. CSE-B" value={regForm.branch} onChange={e => setRegForm(p => ({ ...p, branch: e.target.value }))} />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setShowRegModal(false)} className="flex-1 py-4 text-slate-400 hover:text-primary text-sm font-black transition-all border-2 border-transparent hover:border-slate-100 rounded-2xl">Cancel</button>
                    <button onClick={submitRegistration} disabled={regLoading || !regForm.phone || !regForm.year}
                      className="flex-1 py-4 bg-primary hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-black rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3">
                      {regLoading ? <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                      Finalize Entry
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

/* ──── Sub-components ──── */

const TicketCardCompact = ({ event, userId }: any) => (
  <div className="dashboard-card flex flex-col sm:flex-row overflow-hidden group border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all h-full">
    <div className="flex-1 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <span className="text-primary text-[9px] font-black uppercase tracking-[0.4em] leading-none mb-1">Standard Pass</span>
          <span className="text-slate-300 text-[10px] font-mono leading-none">#SC-{event._id?.slice(-6).toUpperCase()}</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
      </div>

      <h3 className="text-primary text-xl font-black tracking-tight mb-8 leading-tight">{event.title}</h3>
      
      <div className="grid grid-cols-2 gap-y-6 gap-x-8">
        <div>
          <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-2">Event Date</p>
          <p className="text-primary text-sm font-black">{event.date}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-2">Zone</p>
          <p className="text-primary text-sm font-black">{event.location?.split(',')[0] || 'Main'}</p>
        </div>
      </div>
    </div>
    
    <div className="flex flex-col items-center justify-center bg-slate-50 border-l border-slate-100 min-w-[180px] p-8 space-y-4">
      <div className="bg-white p-4 rounded-3xl shadow-2xl shadow-black/5 ring-4 ring-primary/5">
        <QRCodeSVG value={`EVT-${event._id}-STU-${userId}`} size={84} level="H" />
      </div>
      <div className="text-center">
        <p className="text-[10px] uppercase font-black tracking-[0.3em] text-primary">SCANNABLE</p>
        <p className="text-[9px] text-slate-400 font-bold mt-1">Authorized ID Verified</p>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Approved: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5',
    Rejected: 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-500/5',
    Pending: 'bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-500/5',
  };
  const icons: Record<string, React.ReactNode> = {
    Approved: <CheckCircle className="w-3.5 h-3.5" />,
    Rejected: <XCircle className="w-3.5 h-3.5" />,
    Pending: <Clock className="w-3.5 h-3.5" />,
  };
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || styles.Pending}`}>
      {icons[status] || icons.Pending} {status || 'Processing'}
    </span>
  );
};

const ProfileInfoItem = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <div className="flex items-center gap-5 py-5 border-b border-slate-50 last:border-0 group">
    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0 group-hover:bg-primary/5 group-hover:border-primary/10 transition-colors">
       {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] mb-1">{label}</p>
      <p className="text-primary text-base font-black truncate leading-tight">{value || 'Not Configured'}</p>
    </div>
  </div>
);

const HistoryIcon = () => (
  <History className="w-4 h-4 text-emerald-400" />
);

export default StudentDashboard;
