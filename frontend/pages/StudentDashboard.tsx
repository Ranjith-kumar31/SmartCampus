import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Ticket, FileCheck, User, Settings, CalendarDays, MapPin, Clock, Send, X, CheckCircle, XCircle, ChevronRight, Sparkles, Brain, TrendingUp, BadgeCheck, Zap, History } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import toast from 'react-hot-toast';
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
    'AI & ML': 'bg-indigo-600',
    'AI & DS': 'bg-violet-600',
    'Web Development': 'bg-cyan-600',
    'Cybersecurity': 'bg-red-600',
    'Robotics': 'bg-amber-600',
    'Cultural': 'bg-pink-600',
    'Sports': 'bg-emerald-600',
    'General': 'bg-slate-600',
    'Technology': 'bg-indigo-600',
    'Design': 'bg-cyan-600',
    'Music': 'bg-violet-600',
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
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">AI Smart Suggestions</h2>
                <p className="text-slate-400 text-sm">Personalized events based on your history & OD patterns</p>
              </div>
            </div>

            {aiLoading ? (
              <div className="dashboard-card p-12 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                <p className="text-slate-400">Analyzing your activity...</p>
              </div>
            ) : aiSuggestions ? (
              <>
                {/* Insight Banner */}
                <div className="dashboard-card p-5 border border-violet-500/20 bg-violet-500/5 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm mb-1">🧠 AI Insight</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{aiSuggestions.insight}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-violet-400">{aiSuggestions.totalRegistered}</div>
                    <div className="text-xs text-slate-500">events registered</div>
                  </div>
                </div>

                {/* OD Approval Rate */}
                <div className="dashboard-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-white font-medium text-sm">OD Approval Rate</span>
                    </div>
                    <span className={`text-lg font-bold ${aiSuggestions.odApprovalRate >= 70 ? 'text-emerald-400' : aiSuggestions.odApprovalRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                      {aiSuggestions.odApprovalRate}%
                    </span>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${aiSuggestions.odApprovalRate >= 70 ? 'bg-emerald-500' : aiSuggestions.odApprovalRate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${aiSuggestions.odApprovalRate}%` }}
                    />
                  </div>
                  <p className="text-slate-500 text-xs mt-2">
                    {aiSuggestions.odApprovalRate >= 70 ? '✅ Your HOD approves most OD requests — go for it!' :
                     aiSuggestions.odApprovalRate >= 40 ? '⚡ Moderate approval rate — choose events carefully.' :
                     '⚠️ Low approval rate — provide detailed reasons in OD requests.'}
                  </p>
                </div>

                {/* Recommendation Cards */}
                <div>
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" /> Top {aiSuggestions.recommendations.length} Recommendations for You
                  </h3>
                  <div className="space-y-4">
                    {aiSuggestions.recommendations.length === 0 ? (
                      <div className="dashboard-card p-10 text-center text-slate-400">
                        <p className="text-4xl mb-3">🎯</p>
                        <p className="font-medium text-white">All caught up!</p>
                        <p className="text-sm mt-1">You've registered for all available events. Check back when new events are added.</p>
                      </div>
                    ) : aiSuggestions.recommendations.map((item: any, i: number) => (
                      <motion.div
                        key={item.event._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="dashboard-card p-5 border border-white/[0.04] hover:border-violet-500/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-bold">{item.event.title}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                item.matchColor === 'emerald' ? 'bg-emerald-500/15 text-emerald-400' :
                                item.matchColor === 'indigo' ? 'bg-indigo-500/15 text-indigo-400' :
                                item.matchColor === 'amber' ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-500/15 text-slate-400'
                              }`}>{item.matchLabel}</span>
                            </div>
                            <p className="text-slate-400 text-xs">{item.event.club?.name} · {item.event.domain}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xl font-bold text-violet-400">{item.score}</div>
                            <div className="text-[10px] text-slate-500">AI score</div>
                          </div>
                        </div>

                        {/* Top Reason Highlight */}
                        <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2 mb-3">
                          <BadgeCheck className="w-4 h-4 text-violet-400 shrink-0" />
                          <p className="text-slate-300 text-xs">{item.topReason}</p>
                        </div>

                        {/* Reason pills */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {item.reasons.slice(1).map((r: string, ri: number) => (
                            <span key={ri} className="text-[11px] px-2 py-0.5 bg-white/[0.04] text-slate-400 rounded-md">{r}</span>
                          ))}
                        </div>

                        {/* Event details row */}
                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                          <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{item.event.date}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{item.event.location}</span>
                          <span className="flex items-center gap-1">
                            {item.event.regFee === 0 ? '🆓 Free' : `₹${item.event.regFee}`}
                          </span>
                          <span className={`ml-auto font-medium ${
                            item.odProbability >= 70 ? 'text-emerald-400' :
                            item.odProbability >= 40 ? 'text-amber-400' : 'text-red-400'
                          }`}>OD: {item.odProbability}%</span>
                        </div>

                        <button
                          onClick={() => handleRegister(item.event._id)}
                          className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition-all"
                        >
                          Register for this Event →
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="dashboard-card p-10 text-center">
                <p className="text-4xl mb-3">🤖</p>
                <p className="text-white font-medium">Click below to load your personalized suggestions</p>
                <button onClick={fetchAiSuggestions} className="mt-4 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors">
                  Generate Suggestions
                </button>
              </div>
            )}
          </div>
        )}

        
        {/* ===== EVENTS TAB ===== */}
        {activeTab === 'events' && (
          <div className="space-y-8">
            {/* Upcoming Events */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
                <button className="text-indigo-400 text-sm font-medium hover:text-indigo-300 transition-colors">View All</button>
              </div>
              {loading ? (
                <div className="text-center py-20 text-slate-500">Loading events...</div>
              ) : events.length === 0 ? (
                <div className="dashboard-card p-12 text-center text-slate-500">No events available right now.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {events.map(event => {
                    const isRegistered = registeredEventIds.has(event.id || event._id);
                    const badgeColor = categoryColors[event.domain] || 'bg-slate-600';
                    return (
                      <div key={event._id} className="dashboard-card overflow-hidden group hover:border-indigo-500/20 transition-all duration-300">
                        {/* Image */}
                        <div className="h-44 bg-[#111630] relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1021] via-transparent to-transparent z-10" />
                          <img
                            src={`https://source.unsplash.com/random/400x300/?technology,event&sig=${event._id}`}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                          />
                          <span className={`absolute top-3 left-3 z-20 ${badgeColor} text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md`}>
                            {event.domain}
                          </span>
                        </div>
                        {/* Content */}
                        <div className="p-5">
                          <h3 className="text-white font-bold text-base mb-3">{event.title}</h3>
                          <div className="space-y-2 text-slate-400 text-sm mb-5">
                            <div className="flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5 text-slate-500" /> {event.date}</div>
                            <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {event.location}</div>
                          </div>
                          {isRegistered ? (
                            <button disabled className="w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-500 text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2">
                              <CheckCircle className="w-4 h-4" /> Registered
                            </button>
                          ) : (
                            <button onClick={() => openRegModal(event)} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/20">
                              Register Now
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Registered Tickets Preview */}
            {registeredEvents.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-white">My Registered Tickets</h2>
                  <button onClick={() => setActiveTab('tickets')} className="text-indigo-400 text-sm font-medium hover:text-indigo-300 transition-colors flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {registeredEvents.slice(0, 2).map(event => (
                    <TicketCardCompact key={event._id} event={event} userId={user.id} />
                  ))}
                </div>
              </div>
            )}

            {/* OD Requests Preview */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">On-Duty (OD) Requests</h2>
                <button onClick={() => setShowOdModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                  Request OD
                </button>
              </div>
              <div className="dashboard-card overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Event Name</th>
                      <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Date Applied</th>
                      <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Hours</th>
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
                          <td className="px-5 py-3.5">
                            <p className="text-white font-medium">{req.event?.title || 'N/A'}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{req.reason?.slice(0, 40)}...</p>
                          </td>
                          <td className="px-5 py-3.5 text-slate-400">{req.event?.date || 'N/A'}</td>
                          <td className="px-5 py-3.5 text-slate-400">48 Hrs</td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={req.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== TICKETS TAB ===== */}
        {activeTab === 'tickets' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-5">My Tickets</h2>
            {registeredEvents.length === 0 ? (
              <div className="dashboard-card p-12 text-center text-slate-500">No tickets found. Register for events to see them here.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {registeredEvents.map(event => (
                  <TicketCardCompact key={event.registrationId || event._id} event={event} userId={user.id} />
                ))}
              </div>
            )}
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
          const upcomingEvents = registeredEvents.filter(e => e.date >= today);
          const pastEvents = registeredEvents.filter(e => e.date < today);
          const approvedOds = odRequests.filter(r => r.status === 'Approved').length;

          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Student Profile</h2>
                <button className="text-sm text-indigo-400 font-medium hover:text-indigo-300 transition-colors">Edit Details</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: User Info */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="dashboard-card p-6 text-center">
                    <div className="relative inline-block mb-4">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-4 ring-indigo-500/20 shadow-xl shadow-indigo-500/10">
                        <span className="text-4xl font-bold text-white uppercase">{user.name?.charAt(0)}</span>
                      </div>
                      <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#0c1021] flex items-center justify-center" title="Account Verified">
                        <BadgeCheck className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <h3 className="text-white text-lg font-bold">{user.name}</h3>
                    <p className="text-slate-500 text-sm mb-4">Undergraduate Student</p>
                    
                    <div className="space-y-3 pt-4 border-t border-white/[0.04] text-left">
                      <ProfileInfoItem label="Department" value={user.department} icon="🏫" />
                      <ProfileInfoItem label="Student ID" value={user.rollNumber || 'N/A'} icon="🆔" />
                      <ProfileInfoItem label="Email Address" value={user.email} icon="📧" />
                      <ProfileInfoItem label="Year of Study" value="3rd Year (B.Tech)" icon="📅" />
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="dashboard-card p-4 text-center">
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Events</p>
                      <p className="text-2xl font-bold text-indigo-400">{registeredEvents.length}</p>
                    </div>
                    <div className="dashboard-card p-4 text-center">
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">OD Approved</p>
                      <p className="text-2xl font-bold text-emerald-400">{approvedOds}</p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Activity History */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Upcoming Registrations */}
                  <div className="dashboard-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <h3 className="text-white font-bold text-sm">Upcoming Registrations</h3>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                      {upcomingEvents.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 italic text-sm">No upcoming events. Browse events to join!</div>
                      ) : (
                        upcomingEvents.map(event => (
                          <div key={event._id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-lg ${categoryColors[event.domain] || 'bg-slate-700'} flex items-center justify-center text-white font-bold shadow-lg`}>
                                {event.title?.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-white text-sm font-bold">{event.title}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-slate-500 text-xs flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {event.date}</span>
                                  <span className="text-slate-500 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
                                </div>
                              </div>
                            </div>
                            <button onClick={() => setActiveTab('tickets')} className="text-indigo-400 text-xs font-bold hover:underline">View Ticket</button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Participation History */}
                  <div className="dashboard-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
                      <HistoryIcon />
                      <h3 className="text-white font-bold text-sm">Participation History</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px]">
                        <thead>
                          <tr className="bg-white/[0.02]">
                            <th className="px-5 py-3 text-slate-500 font-semibold">Event</th>
                            <th className="px-5 py-3 text-slate-500 font-semibold">Date</th>
                            <th className="px-5 py-3 text-slate-500 font-semibold text-center">OD Used</th>
                            <th className="px-5 py-3 text-slate-500 font-semibold text-right">Certificate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {pastEvents.length === 0 ? (
                            <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-600 italic">No past participation records found.</td></tr>
                          ) : (
                            pastEvents.map(event => {
                              const hasOd = odRequests.some(r => r.eventId === event._id && r.status === 'Approved');
                              return (
                                <tr key={event._id} className="hover:bg-white/[0.01]">
                                  <td className="px-5 py-3.5 text-white font-medium">{event.title}</td>
                                  <td className="px-5 py-3 text-slate-400">{event.date}</td>
                                  <td className="px-5 py-3 text-center">
                                    {hasOd ? <span className="text-emerald-400">Yes</span> : <span className="text-slate-600">—</span>}
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    <button className="text-indigo-400 hover:text-indigo-300 font-medium">Download</button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recent OD Summary */}
                  <div className="dashboard-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-white font-bold text-sm">Recent OD Activity</h3>
                      </div>
                      <button onClick={() => setActiveTab('od')} className="text-[11px] text-slate-500 hover:text-white uppercase tracking-widest font-bold">See All</button>
                    </div>
                    <div className="space-y-3">
                      {odRequests.slice(0, 3).map(req => (
                        <div key={req._id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <div className="min-w-0">
                            <p className="text-slate-300 text-xs font-semibold truncate">{req.event?.title || 'Event Reference'}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{new Date(req.createdAt).toLocaleDateString()}</p>
                          </div>
                          <StatusBadge status={req.status} />
                        </div>
                      ))}
                      {odRequests.length === 0 && <p className="text-center text-slate-600 text-xs py-4 italic">No OD requests recorded.</p>}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* ===== SETTINGS TAB ===== */}
        {activeTab === 'settings' && (
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-white mb-5">Settings</h2>
            <div className="dashboard-card p-6 text-slate-400 text-center">Settings page coming soon.</div>
          </div>
        )}
      </motion.div>

      {/* ===== OD MODAL ===== */}
      <AnimatePresence>
        {showOdModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowOdModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="dashboard-card w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowOdModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              <h3 className="text-lg font-bold text-white mb-5">Submit OD Request</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Select Event</label>
                  <select className="input-field" value={selectedEventForOd} onChange={(e) => setSelectedEventForOd(e.target.value)}>
                    <option value="" disabled className="bg-[#0c1021]">Choose a registered event</option>
                    {registeredEvents.map((ev: any) => (
                      <option key={ev._id} value={ev._id} className="bg-[#0c1021]">{ev.title} — {ev.date}</option>
                    ))}
                  </select>
                  {registeredEvents.length === 0 && <p className="text-xs text-amber-400 mt-1">You need to register for events first.</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Reason for OD</label>
                  <textarea className="input-field resize-none h-28" placeholder="e.g., Participating in Hackathon as a team member"
                    value={odReason} onChange={(e) => setOdReason(e.target.value)} />
                </div>
                <button onClick={handleOdSubmit} disabled={registeredEvents.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Submit Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== REGISTRATION FORM MODAL ===== */}
      <AnimatePresence>
        {showRegModal && regEventTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowRegModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="dashboard-card w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowRegModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>

              <div className="mb-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1 block">Event Registration</span>
                <h3 className="text-lg font-bold text-white">{regEventTarget.title}</h3>
                <p className="text-slate-500 text-xs mt-1">{regEventTarget.date} · {regEventTarget.location}</p>
              </div>

              {/* Pre-filled student info */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Your Details (auto-filled)</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-slate-500 text-[10px] uppercase">Name</p><p className="text-white font-medium">{user.name}</p></div>
                  <div><p className="text-slate-500 text-[10px] uppercase">Roll No</p><p className="text-white font-medium">{user.rollNumber || 'N/A'}</p></div>
                  <div><p className="text-slate-500 text-[10px] uppercase">Department</p><p className="text-white font-medium">{user.department}</p></div>
                  <div><p className="text-slate-500 text-[10px] uppercase">Email</p><p className="text-white font-medium truncate">{user.email}</p></div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Additional Details Required</p>

                <div>
                  <label className="form-label">Phone Number <span className="text-red-400">*</span></label>
                  <input type="tel" className="input-field" placeholder="e.g. 9876543210"
                    value={regForm.phone} onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Year of Study <span className="text-red-400">*</span></label>
                    <select className="input-field" value={regForm.year} onChange={e => setRegForm(p => ({ ...p, year: e.target.value }))}>
                      <option value="" className="bg-[#0c1021]">Select Year</option>
                      {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => (
                        <option key={y} value={y} className="bg-[#0c1021]">{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Branch / Section</label>
                    <input className="input-field" placeholder="e.g. CSE-A"
                      value={regForm.branch} onChange={e => setRegForm(p => ({ ...p, branch: e.target.value }))} />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowRegModal(false)} className="flex-1 py-2.5 text-slate-400 hover:text-white text-sm font-medium transition-colors border border-white/[0.06] rounded-xl">Cancel</button>
                  <button onClick={submitRegistration} disabled={regLoading}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                    {regLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                    Confirm Registration
                  </button>
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
  <div className="dashboard-card flex flex-col sm:flex-row overflow-hidden group">
    <div className="flex-1 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">Student Pass</span>
        <span className="text-slate-500 text-xs font-mono">Ref: #INT-{event._id.slice(-5)}</span>
      </div>
      <h3 className="text-white text-lg font-bold mb-4">{event.title}</h3>
      <div className="flex gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">Date</p>
          <p className="text-white text-sm font-semibold">{event.date}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">Seat</p>
          <p className="text-white text-sm font-semibold">{event.location?.split(',')[0] || 'General'}</p>
        </div>
      </div>
    </div>
    <div className="flex flex-col items-center justify-center px-6 py-5 bg-white/[0.02] border-l border-white/[0.06] min-w-[140px]">
      <div className="bg-white p-2 rounded-lg mb-2">
        <QRCodeSVG value={`EVT-${event._id}-STU-${userId}`} size={72} level="H" />
      </div>
      <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">Scan to Enter</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  const icons: Record<string, React.ReactNode> = {
    Approved: <CheckCircle className="w-3 h-3" />,
    Rejected: <XCircle className="w-3 h-3" />,
    Pending: <Clock className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${styles[status] || styles.Pending}`}>
      {icons[status]} {status}
    </span>
  );
};

const ProfileInfoItem = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <div className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0 group">
    <span className="text-lg grayscale group-hover:grayscale-0 transition-all">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-0.5">{label}</p>
      <p className="text-slate-200 text-sm font-medium truncate">{value}</p>
    </div>
  </div>
);

const HistoryIcon = () => (
  <History className="w-4 h-4 text-emerald-400" />
);

export default StudentDashboard;
