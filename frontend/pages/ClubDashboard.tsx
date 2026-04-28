import { useState, useEffect } from 'react';
import { LayoutDashboard, CalendarPlus, Users, QrCode, BarChart2, Settings, PlusCircle, Trash2, Clock, MapPin, CalendarDays, IndianRupee, X, TrendingUp, ChevronRight, BadgeCheck, ShieldCheck, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layouts/DashboardLayout';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

const navItems = [
  { icon: LayoutDashboard, label: 'Control Center', id: 'overview' },
  { icon: CalendarPlus, label: 'Event Suite', id: 'events' },
  { icon: Users, label: 'Registrations', id: 'participants' },
  { icon: QrCode, label: 'Entry Gateway', id: 'scanner' },
  { icon: BarChart2, label: 'Intelligence', id: 'analytics' },
  { icon: Settings, label: 'Preferences', id: 'settings' },
];

/* ─── helpers ─── */
const getUser = () => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } };

const ClubDashboard = () => {
  const user = getUser();

  const [activeView, setActiveView] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Participants state
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);

  // QR Scanner state
  const [scannerEventId, setScannerEventId] = useState<string>('');
  const [scannedLog, setScannedLog] = useState<any[]>([]);
  const [manualTicket, setManualTicket] = useState('');

  const [autoCheckin, setAutoCheckin] = useState(true);

  const [formData, setFormData] = useState({
    title: '', domain: '', date: '', time: '', location: '',
    expectedAudience: '', regFee: '0', description: '', rules: [''], prizes: [''],
  });

  /* ── Fetch this club's events from dedicated endpoint ── */
  const fetchClubEvents = async () => {
    if (!user.id) return;
    setLoadingEvents(true);
    try {
      const res = await api.get(`/events/club/${user.id}`);
      setEvents(res.data);
    } catch {
      console.error('Failed to fetch club events');
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => { fetchClubEvents(); }, []);

  /* ── Auto-select first event for participants tab ── */
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id || events[0]._id);
    }
    if (events.length > 0 && !scannerEventId) {
      setScannerEventId(events[0].id || events[0]._id);
    }
  }, [events]);

  /* ── Fetch participants when event is selected ── */
  const fetchParticipants = async (eventId: string) => {
    if (!eventId) return;
    setLoadingParticipants(true);
    try {
      const res = await api.get(`/events/${eventId}/participants`);
      setParticipants(res.data.participants || []);
    } catch {
      toast.error('Failed to load participants');
    } finally {
      setLoadingParticipants(false);
    }
  };

  useEffect(() => {
    if (activeView === 'participants' && selectedEventId) {
      fetchParticipants(selectedEventId);
    }
    if (activeView === 'scanner' && scannerEventId) {
      fetchParticipants(scannerEventId); // load participants for QR scanner too
    }
  }, [activeView, selectedEventId, scannerEventId]);

  /* ── Form helpers ── */
  const handleFormChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleArrayField = (field: 'rules' | 'prizes', index: number, value: string) => {
    const updated = [...formData[field]]; updated[index] = value;
    setFormData(prev => ({ ...prev, [field]: updated }));
  };
  const addArrayItem = (field: 'rules' | 'prizes') => setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  const removeArrayItem = (field: 'rules' | 'prizes', index: number) => setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));

  const handleSubmitEvent = async () => {
    if (!formData.title || !formData.domain || !formData.date || !formData.time || !formData.location || !formData.description) {
      toast.error('Please fill in all required fields'); return;
    }
    try {
      await api.post('/events', {
        ...formData,
        clubId: user.id,
        expectedAudience: parseInt(formData.expectedAudience, 10) || 0,
        regFee: parseInt(formData.regFee, 10) || 0,
        rules: formData.rules.filter(r => r.trim()),
        prizes: formData.prizes.filter(p => p.trim()),
      });
      toast.success('Event proposed! Pending admin approval.');
      setShowCreateModal(false);
      setFormData({ title: '', domain: '', date: '', time: '', location: '', expectedAudience: '', regFee: '0', description: '', rules: [''], prizes: [''] });
      fetchClubEvents();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to create event'); }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    try { await api.delete(`/events/${id}`); toast.success('Event deleted'); fetchClubEvents(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed to delete event'); }
  };

  /* ── QR scan simulation: match ticket string "EVT-<evtId>-STU-<stuId>" ── */
  const handleManualScan = async () => {
    if (!manualTicket.trim()) { toast.error('Enter a ticket ID'); return; }
    const parts = manualTicket.trim().split('-STU-');
    if (parts.length !== 2 || !parts[0].startsWith('EVT-')) {
      toast.error('Invalid ticket format. Expected: EVT-<eventId>-STU-<studentId>');
      return;
    }
    const ticketEventId = parts[0].replace('EVT-', '');
    const studentId = parts[1];

    // validate event matches selected scanner event
    const currentEventId = scannerEventId;
    if (ticketEventId !== currentEventId) {
      toast.error('This ticket belongs to a different event!');
      return;
    }

    const participant = participants.find(p => p.studentId === studentId);
    if (!participant) {
      toast.error('Student not registered for this event');
      return;
    }

    if (participant.isCheckedIn) {
      toast('Already checked in!', { icon: '⚠️' });
      return;
    }

    try {
      await api.post(`/events/${currentEventId}/check-in`, { studentId });
      
      const logEntry = {
        studentId,
        eventId: currentEventId,
        name: participant.name,
        rollNumber: participant.rollNumber,
        department: participant.department,
        scannedAt: new Date(),
      };
      
      setScannedLog(prev => [logEntry, ...prev]);
      
      // Update local participants state to avoid refetch
      setParticipants(prev => prev.map(p => 
        p.studentId === studentId ? { ...p, isCheckedIn: true, checkedInAt: new Date().toISOString() } : p
      ));

      if (autoCheckin) toast.success(`Check-in successful: ${participant.name} ✅`);
      setManualTicket('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };

  /* ── Derived data ── */
  const totalRegistrations = events.reduce((a, e) => a + (e.registration_count || 0), 0);
  const totalRevenue = events.reduce((a, e) => a + ((e.registration_count || 0) * (e.regFee || e.reg_fee || 0)), 0);

  const approvedEvents = events.filter(e => e.status === 'Approved');

  // Chart data: registrations per event (real)
  const chartData = approvedEvents.slice(0, 7).map(e => ({
    name: e.title?.slice(0, 12) + (e.title?.length > 12 ? '…' : ''),
    regs: e.registration_count || 0,
  }));

  // Filtered participants
  const departments = ['All', ...Array.from(new Set(participants.map(p => p.department))).filter(Boolean)];
  const filteredParticipants = participants.filter(p => {
    const matchSearch = participantSearch === '' ||
      p.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
      p.rollNumber.toLowerCase().includes(participantSearch.toLowerCase());
    const matchDept = deptFilter === 'All' || p.department === deptFilter;
    return matchSearch && matchDept;
  });

  const selectedEvent = events.find(e => (e.id || e._id) === selectedEventId);

  return (
    <>
    <DashboardLayout
      title={`${user.name} Operations`}
      subtitle="Strategic management of club assets and events"
      userName={user.name || 'Club'}
      userRole="Verified Organizer"
      userId={user.id?.slice(-6).toUpperCase()}
      navItems={navItems}
      activeView={activeView}
      onViewChange={setActiveView}
      searchPlaceholder="Search intelligence, records..."
    >

      {/* ===== OVERVIEW ===== */}
      {activeView === 'overview' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
          <div>
            <h2 className="text-primary dark:text-white font-black text-3xl tracking-tight">Performance Intelligence</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Real-time engagement metrics and operational overview</p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatCardNew title="Total Throughput" value={totalRegistrations.toLocaleString()} icon={<Users className="w-6 h-6" />} subtitle="Total event participants" />
            <StatCardNew title="Asset Liquidity" value={`₹${totalRevenue.toLocaleString()}`} icon={<IndianRupee className="w-6 h-6" />} subtitle="Generated event revenue" />
            <StatCardNew title="Active Clusters" value={events.length} icon={<CalendarPlus className="w-6 h-6" />} subtitle={`${approvedEvents.length} authorized events`} />
          </div>

          {/* Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 dashboard-card p-10 rounded-[3rem] border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-primary dark:text-white font-black text-xl tracking-tight">Registration Velocity</h3>
                 <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Strategic Performance</span>
                 </div>
              </div>
              {chartData.length === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center text-slate-300 gap-4">
                  <div className="w-16 h-16 border-4 border-slate-50 border-t-slate-100 rounded-full" />
                  <p className="font-black text-xs uppercase tracking-widest">Awaiting Authorized Events</p>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid vertical={false} strokeDasharray="8 8" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#cbd5e1" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} dy={15} />
                      <YAxis stroke="#cbd5e1" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1A3A5A', border: 'none', borderRadius: '24px', color: '#fff', fontSize: '11px', fontWeight: '900', padding: '16px 24px', boxShadow: '0 25px 50px -12px rgba(26,58,90,0.25)' }}
                        itemStyle={{ color: '#00AEEF' }}
                      />
                      <Line type="monotone" dataKey="regs" stroke="#1A3A5A" strokeWidth={5} dot={{ r: 0 }} activeDot={{ r: 8, fill: '#00AEEF', strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Quick Overview */}
            <div className="dashboard-card p-10 rounded-[3rem] border-slate-100 shadow-sm bg-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
              <h3 className="text-primary font-black text-xl tracking-tight mb-10 relative z-10">Cluster Pipeline</h3>
              <div className="space-y-6 relative z-10">
                {events.length > 0 ? (
                  events.slice(0, 5).map(e => (
                    <div key={e.id || e._id} className="flex items-center justify-between group cursor-pointer">
                      <div className="min-w-0">
                        <p className="text-primary text-sm font-black truncate group-hover:text-secondary transition-colors">{e.title}</p>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">{e.date}</p>
                      </div>
                      <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${
                        e.status === 'Approved' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                        e.status === 'Rejected' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                        'bg-amber-50 text-amber-500 border-amber-100'
                      }`}>{e.status}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-300 font-medium text-center py-10">No active clusters detected.</p>
                )}
              </div>
              <button onClick={() => setActiveView('events')} className="w-full mt-10 py-5 bg-slate-50 text-primary font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all border border-slate-100">Synchronize View</button>
            </div>
          </div>

          {/* Active Events Table */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-primary font-black text-2xl tracking-tight">Deployment Table</h3>
              <button onClick={() => setActiveView('events')} className="text-secondary font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">Command Console <ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="dashboard-card overflow-hidden rounded-[3rem] border-slate-100 shadow-sm bg-white">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-10 py-6 text-[10px] uppercase font-black tracking-widest text-slate-400">Active Cluster / Entity</th>
                    <th className="px-10 py-6 text-[10px] uppercase font-black tracking-widest text-slate-400">Launch Sync</th>
                    <th className="px-10 py-6 text-[10px] uppercase font-black tracking-widest text-slate-400">Throughput</th>
                    <th className="px-10 py-6 text-[10px] uppercase font-black tracking-widest text-slate-400">Authorization</th>
                    <th className="px-10 py-6 text-[10px] uppercase font-black tracking-widest text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loadingEvents ? (
                    <tr><td colSpan={5} className="px-10 py-24 text-center">
                       <div className="w-12 h-12 border-4 border-slate-50 border-t-primary rounded-full animate-spin inline-block" />
                    </td></tr>
                  ) : events.length === 0 ? (
                    <tr><td colSpan={5} className="px-10 py-24 text-center">
                       <p className="text-slate-300 font-black text-xs uppercase tracking-[0.3em]">No clusters deployed in current cycle</p>
                    </td></tr>
                  ) : events.map((event: any) => {
                    const eId = event.id || event._id;
                    return (
                    <tr key={eId} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center font-black text-xl shadow-2xl shadow-primary/5 group-hover:scale-105 transition-transform">
                            {event.title?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-primary font-black text-sm">{event.title}</p>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1.5">{event.domain}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                         <p className="text-primary font-black text-xs">{event.date}</p>
                         <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">{event.time}</p>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-black text-lg">{event.registration_count ?? 0}</span>
                          <span className="text-slate-300 font-black text-xs">/ {event.expectedAudience ?? event.expected_audience ?? '∞'}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                          event.status === 'Approved' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                          event.status === 'Rejected' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                          'bg-amber-50 text-amber-500 border-amber-100'
                        }`}>{event.status}</span>
                      </td>
                      <td className="px-10 py-8">
                         <button onClick={() => handleDeleteEvent(eId)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 border border-slate-100 flex items-center justify-center transition-all"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== MANAGE EVENTS ===== */}
      {activeView === 'events' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-primary dark:text-white font-black text-3xl tracking-tight">Event Strategy Suite</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Lifecycle management for club event deployments</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 rounded-2xl flex items-center gap-3 transition-all shadow-2xl shadow-primary/20">
              <PlusCircle className="w-4 h-4" /> Initialize Cluster
            </button>
          </div>

          {loadingEvents ? (
            <div className="dashboard-card p-32 text-center rounded-[3rem] border-slate-100">
               <div className="w-16 h-16 border-4 border-slate-50 border-t-primary rounded-full animate-spin inline-block" />
            </div>
          ) : events.length === 0 ? (
            <div className="dashboard-card flex flex-col items-center justify-center p-32 text-slate-400 rounded-[3rem] border-slate-100 border-dashed border-4 bg-slate-50/30">
              <CalendarPlus className="w-20 h-20 text-slate-200 mb-8" />
              <h3 className="text-xl font-black text-primary mb-2 tracking-tight uppercase">Operational Void</h3>
              <p className="mb-10 max-w-sm text-center font-medium">Deploy your first event cluster to begin student engagement protocols.</p>
              <button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em] px-10 py-5 rounded-2xl flex items-center gap-3 shadow-xl shadow-primary/10 transition-all">
                <PlusCircle className="w-5 h-5" /> Launch Operation
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {events.map((event: any) => {
                const eId = event.id || event._id;
                return (
                <div key={eId} className="dashboard-card p-10 rounded-[2.5rem] border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/10 transition-all bg-white group flex flex-col justify-between">
                  <div className="relative">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex-1">
                        <span className={`inline-block px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border mb-4 ${
                          event.status === 'Approved' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                          event.status === 'Rejected' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-amber-50 text-amber-500 border-amber-100'
                        }`}>{event.status}</span>
                        <h3 className="text-primary font-black text-2xl tracking-tight group-hover:text-secondary transition-colors mb-2">{event.title}</h3>
                        <p className="text-secondary font-black text-[10px] uppercase tracking-widest">{event.domain}</p>
                      </div>
                      <button onClick={() => handleDeleteEvent(eId)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 border border-slate-100 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    
                    <p className="text-slate-500 text-sm font-medium mb-10 line-clamp-3 leading-relaxed">{event.description}</p>
                    
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-t border-slate-50 pt-10">
                      <div className="flex items-center gap-4 text-primary font-black text-[10px] tracking-widest uppercase">
                        <CalendarDays className="w-4 h-4 text-slate-300" /> {event.date}
                      </div>
                      <div className="flex items-center gap-4 text-primary font-black text-[10px] tracking-widest uppercase">
                        <Clock className="w-4 h-4 text-slate-300" /> {event.time}
                      </div>
                      <div className="flex items-center gap-4 text-primary font-black text-[10px] tracking-widest uppercase">
                        <MapPin className="w-4 h-4 text-slate-300" /> {event.location}
                      </div>
                      <div className="flex items-center gap-4 text-primary font-black text-[10px] tracking-widest uppercase">
                        <Users className="w-4 h-4 text-slate-300" /> 
                        <span className="text-secondary font-black">{event.registration_count ?? 0}</span> 
                        <span className="text-slate-300">/ {event.expectedAudience ?? event.expected_audience ?? '∞'}</span>
                      </div>
                    </div>
                  </div>

                  {event.status === 'Approved' && (
                    <button
                      onClick={() => { setSelectedEventId(eId); setActiveView('participants'); }}
                      className="mt-10 w-full py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/10 hover:bg-slate-800 transition-all border border-primary/5"
                    >
                      Audit {event.registration_count ?? 0} Registrations →
                    </button>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ===== EVENT PARTICIPANTS ===== */}
      {activeView === 'participants' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
          <div>
            <h2 className="text-primary dark:text-white font-black text-3xl tracking-tight">Registration Auditing</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Deep dive into participant metadata and acquisition status</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
             {/* LEFT: Selector & Search */}
             <div className="lg:col-span-4 space-y-8">
                <div className="dashboard-card p-10 rounded-[2.5rem] border-slate-100 bg-white shadow-sm">
                  <label className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4 block">Deployment Node</label>
                  <select
                    className="w-full bg-slate-50 border-0 outline-none rounded-2xl px-6 py-4 text-primary font-black text-xs uppercase tracking-widest cursor-pointer focus:ring-2 ring-secondary/20 transition-all"
                    value={selectedEventId}
                    onChange={e => { setSelectedEventId(e.target.value); setParticipantSearch(''); setDeptFilter('All'); }}
                  >
                    <option value="">— Select Target Cluster —</option>
                    {events.map(e => (
                      <option key={e.id || e._id} value={e.id || e._id}>
                        {e.title} [{e.status}]
                      </option>
                    ))}
                  </select>

                  <div className="mt-8">
                    <label className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4 block">Identity Filter</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full bg-slate-50 border-0 outline-none rounded-2xl px-12 py-4 text-primary font-black text-xs tracking-widest placeholder:text-slate-300 focus:ring-2 ring-secondary/20 transition-all"
                        placeholder="SEARCH NAME / ROLL..."
                        value={participantSearch}
                        onChange={e => setParticipantSearch(e.target.value)}
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black">🔍</span>
                    </div>
                  </div>
                </div>

                {selectedEvent && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="dashboard-card p-8 rounded-[2rem] border-slate-100 bg-white text-center shadow-sm">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Throughput</p>
                      <p className="text-primary text-4xl font-black">{participants.length}</p>
                    </div>
                    <div className="dashboard-card p-8 rounded-[2rem] border-slate-100 bg-white text-center shadow-sm">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Sync Check</p>
                      <p className="text-emerald-500 text-4xl font-black">
                        {scannedLog.filter(s => s.eventId === selectedEventId).length}
                      </p>
                    </div>
                  </div>
                )}
             </div>

             {/* RIGHT: Table/List */}
             <div className="lg:col-span-8 space-y-8">
               {/* Department Filter Bar */}
                {departments.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none px-1">
                    {departments.map(dept => (
                      <button
                        key={dept}
                        onClick={() => setDeptFilter(dept)}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                          deptFilter === dept
                            ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20'
                            : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        {dept} Hub
                      </button>
                    ))}
                  </div>
                )}

                {/* List Body */}
                {!selectedEventId ? (
                  <div className="dashboard-card p-32 text-center rounded-[3rem] border-slate-100 bg-white shadow-sm">
                     <p className="text-slate-300 font-black text-xs uppercase tracking-[0.3em]">Initialize audit by selecting node</p>
                  </div>
                ) : loadingParticipants ? (
                  <div className="dashboard-card p-32 text-center rounded-[3rem] border-slate-100 bg-white shadow-sm">
                     <div className="w-16 h-16 border-4 border-slate-50 border-t-primary rounded-full animate-spin inline-block" />
                  </div>
                ) : filteredParticipants.length === 0 ? (
                  <div className="dashboard-card p-32 text-center rounded-[3rem] border-slate-100 bg-white shadow-sm">
                    <p className="text-slate-300 font-black text-xs uppercase tracking-[0.3em]">No registration metadata found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredParticipants.map((p, i) => {
                      const isCheckedIn = p.isCheckedIn;
                      return (
                        <div
                          key={p.studentId || i}
                          className="dashboard-card p-6 flex items-center gap-8 cursor-pointer border-slate-100 hover:border-primary/20 hover:bg-primary/[0.02] transition-all bg-white group rounded-[2.5rem] shadow-sm"
                          onClick={() => setSelectedParticipant({ ...p, isCheckedIn })}
                        >
                          <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 text-primary group-hover:bg-primary group-hover:text-white border border-slate-100 flex items-center justify-center font-black text-2xl transition-all shadow-sm">
                            {p.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-primary font-black text-[15px] group-hover:text-secondary transition-colors truncate">{p.name}</h4>
                            <div className="flex items-center gap-4 mt-1.5 font-bold text-[10px] uppercase tracking-widest text-slate-400">
                               <span>{p.rollNumber}</span>
                               <span className="w-1 h-1 rounded-full bg-slate-200" />
                               <span>{p.department} Hub</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 shrink-0">
                            <span className={`px-4 py-2 text-[8px] font-black uppercase tracking-[0.2em] rounded-xl border ${
                              isCheckedIn ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-primary/5 text-primary border-primary/10'
                            }`}>
                              {isCheckedIn ? 'VERIFIED' : 'PENDING SYNC'}
                            </span>
                            <ChevronRight className="w-5 h-5 text-slate-100 group-hover:text-secondary transition-colors" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
             </div>
          </div>
        </motion.div>
      )}

      {/* ===== ENTRY GATEWAY (QR SCANNER) ===== */}
      {activeView === 'scanner' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto space-y-10 pb-20">
          <div className="text-center">
            <h2 className="text-primary dark:text-white font-black text-3xl tracking-tight">Entry Verification Gateway</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Authorized ticket decryption and access logging</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-12 space-y-8">
              <div className="dashboard-card p-10 rounded-[2.5rem] border-slate-100 bg-white shadow-sm">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 block">Select Operational Node</label>
                <select
                  className="w-full bg-slate-50 border-0 outline-none rounded-2xl px-6 py-5 text-primary font-black text-xs uppercase tracking-widest cursor-pointer focus:ring-2 ring-secondary/20 transition-all font-bold"
                  value={scannerEventId}
                  onChange={e => { setScannerEventId(e.target.value); setScannedLog([]); }}
                >
                  <option value="">— SELECT ACTIVE EVENT —</option>
                  {events.filter(e => e.status === 'Approved').map(e => (
                    <option key={e.id || e._id} value={e.id || e._id}>
                      {e.title} [{e.date}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="dashboard-card p-1 top-0 rounded-[3rem] border-slate-100 bg-slate-50 overflow-hidden relative group shadow-inner">
                <div className="aspect-video bg-white rounded-[2.8rem] flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/[0.02]" />
                  <div className="relative z-10 w-64 h-64">
                     <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                     <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                     <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                     <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                     <div className="absolute top-0 left-0 w-full h-1 bg-secondary shadow-[0_0_20px_rgba(0,174,239,1)] animate-[scan_3s_infinite]" />
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                        <QrCode className="w-20 h-20 text-primary mb-4" />
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Awaiting Identity Token</p>
                     </div>
                  </div>
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-primary/90 backdrop-blur-xl px-8 py-3 rounded-full border border-white/20 shadow-2xl flex items-center gap-4">
                     <div className={`w-2.5 h-2.5 rounded-full ${scannerEventId ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                     <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">{scannerEventId ? 'Verificator Online' : 'Node Offline'}</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-card p-10 rounded-[3rem] border-slate-100 bg-white shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary font-black text-sm">Hyper-sync Protocol</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Automatic entry authorization</p>
                  </div>
                  <button
                    onClick={() => setAutoCheckin(!autoCheckin)}
                    className={`w-14 h-7 rounded-full flex items-center p-1 transition-all ${autoCheckin ? 'bg-secondary' : 'bg-slate-100'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform ${autoCheckin ? 'translate-x-7' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="space-y-4">
                   <div className="flex gap-3">
                      <div className="relative flex-1">
                        <input
                          className="w-full bg-slate-50 border-0 outline-none rounded-2xl px-6 py-5 text-primary font-black text-xs tracking-widest placeholder:text-slate-300 focus:ring-2 ring-secondary/20 transition-all font-mono"
                          placeholder="IDENTITY_STRING_GATEWAY_V1"
                          value={manualTicket}
                          onChange={e => setManualTicket(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleManualScan()}
                        />
                      </div>
                      <button onClick={handleManualScan} className="px-10 bg-primary hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary/10">Authorize</button>
                   </div>
                   <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.2em] text-center">Reference: EVT-[ID]-STU-[ROLL]</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-primary font-black text-xl tracking-tight uppercase">Access Log [Session]</h3>
              <button onClick={() => setScannedLog([])} className="text-rose-500 text-[10px] font-black uppercase tracking-widest hover:underline underline-offset-8 decoration-2 transition-all">Flush Buffer</button>
            </div>
            {scannedLog.filter(s => s.eventId === scannerEventId).length === 0 ? (
              <div className="dashboard-card p-24 text-center rounded-[3rem] border-slate-100 border-dashed border-2 bg-slate-50/50 shadow-sm">
                 <p className="text-slate-300 font-black text-xs uppercase tracking-[0.3em]">Operational log empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {scannedLog.filter(s => s.eventId === scannerEventId).map((s, i) => (
                  <div key={i} className="dashboard-card p-6 flex items-center justify-between bg-white border-slate-100 rounded-3xl group shadow-sm transition-all hover:border-primary/20">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center font-black text-lg shadow-sm">
                        {s.name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-primary font-black text-sm">{s.name}</h4>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                          {s.rollNumber} • {s.department} Hub
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-slate-300 font-black text-[10px] uppercase tracking-widest">
                        {new Date(s.scannedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="w-8 h-8 bg-emerald-500 text-white flex items-center justify-center rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20">✓</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ===== INTELLIGENCE (ANALYTICS) ===== */}
      {activeView === 'analytics' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
          <h2 className="text-primary font-black text-3xl tracking-tight">Predictive Intelligence</h2>
          <div className="dashboard-card p-40 text-center rounded-[4rem] border-slate-100 bg-white shadow-sm">
             <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10">
                <BarChart2 className="w-12 h-12 text-slate-200" />
             </div>
             <p className="text-primary font-black text-xl tracking-tight uppercase mb-2">Module De-synchronized</p>
             <p className="text-slate-400 font-medium">Data harvesting and aggregation protocols in final validation phase.</p>
          </div>
        </motion.div>
      )}

      {/* ===== PREFERENCES (SETTINGS) ===== */}
      {activeView === 'settings' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
          <h2 className="text-primary font-black text-3xl tracking-tight">operational environment</h2>
          <div className="dashboard-card p-40 text-center rounded-[4rem] border-slate-100 bg-white shadow-sm">
             <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10">
                <Settings className="w-12 h-12 text-slate-200" />
             </div>
             <p className="text-primary font-black text-xl tracking-tight uppercase mb-2">RESTRICTED INTERFACE</p>
             <p className="text-slate-400 font-medium">Environmental variables are hard-coded for this deployment cycle.</p>
          </div>
        </motion.div>
      )}

      {/* ===== PROFILE ===== */}
      {activeView === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
          <h2 className="text-primary font-black text-3xl tracking-tight">Registry Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-1 dashboard-card p-10 text-center rounded-[3rem] border-slate-100 bg-white flex flex-col items-center shadow-sm">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-8 border border-slate-100 shadow-sm transition-all group-hover:scale-110 group-hover:rotate-3 overflow-hidden">
                  <span className="text-5xl font-black text-primary uppercase">{user.name?.charAt(0)}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center shadow-xl">
                    <ShieldCheck className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="text-primary text-2xl font-black tracking-tight">{user.name}</h3>
              <p className="text-secondary text-[10px] font-black uppercase tracking-[0.2em] mt-2">Authorized Entity</p>
              
              <div className="mt-10 w-full pt-10 border-t border-slate-50 space-y-8 text-left">
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Affiliated Sector</p>
                  <p className="text-primary font-black text-sm">{user.department} Hub</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Entity ID Token</p>
                  <p className="text-primary font-black text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-100 truncate">{user.id?.toUpperCase() || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-10">
              <div className="dashboard-card p-10 rounded-[3rem] border-slate-100 bg-white shadow-sm">
                <h3 className="text-primary font-black text-lg tracking-tight mb-8">Operational Performance</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-primary/20 transition-all">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Authorized Deployments</p>
                    <p className="text-4xl font-black text-primary group-hover:text-secondary transition-colors">{events.length}</p>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-primary/20 transition-all">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Aggregated Acquisition</p>
                    <p className="text-4xl font-black text-primary group-hover:text-emerald-500 transition-colors">{totalRegistrations}</p>
                  </div>
                </div>
              </div>

              <div className="dashboard-card p-10 rounded-[3rem] border-slate-100 bg-white shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Globe className="w-32 h-32 text-primary" />
                </div>
                <h3 className="text-primary font-black text-lg tracking-tight mb-6">Manifesto</h3>
                <p className="text-slate-500 font-medium leading-relaxed relative z-10">
                  The {user.name} collective is architected to optimize value extraction and creative synergy within the {user.department} ecosystem. 
                  Our protocols prioritize technical excellence and community engagement across all operational vectors.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== CREATE EVENT MODAL ===== */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/20 backdrop-blur-xl"
            onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[3.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-12 relative shadow-2xl border border-white"
              onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowCreateModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-primary transition-colors"><X className="w-8 h-8" /></button>

              <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 bg-primary/5 rounded-[1.5rem] flex items-center justify-center border border-primary/5">
                  <CalendarPlus className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-primary tracking-tight">Deployment Proposal</h3>
                  <p className="text-slate-500 font-medium">Define parameters for new operational cluster</p>
                </div>
              </div>

              <div className="space-y-12">
                <FormSection icon="⚙️" title="Cluster Configuration" color="primary">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">Deployment Identifier [Title]</label>
                      <input className="w-full bg-slate-50 border-0 outline-none rounded-2xl px-6 py-4 text-primary font-bold text-sm placeholder:text-slate-300 focus:ring-2 ring-primary/10 transition-all" placeholder="e.g. STRATEGIC_HACKATHON_V2" value={formData.title} onChange={(e) => handleFormChange('title', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">Domain Sector</label>
                        <select className="w-full bg-slate-50 border-0 outline-none rounded-2xl px-6 py-4 text-primary font-bold text-sm cursor-pointer focus:ring-2 ring-primary/10 transition-all appearance-none" value={formData.domain} onChange={(e) => handleFormChange('domain', e.target.value)}>
                          <option value="" disabled>SELECT SECTOR</option>
                          {['AI & ML', 'AI & DS', 'Web Development', 'Cybersecurity', 'Robotics', 'Cultural', 'Sports', 'General'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">Capacity Forecast</label>
                        <input type="number" className="w-full bg-slate-50 border-0 outline-none rounded-2xl px-6 py-4 text-primary font-bold text-sm placeholder:text-slate-300 focus:ring-2 ring-primary/10 transition-all" placeholder="MAX_IDENTITY_COUNT" value={formData.expectedAudience} onChange={(e) => handleFormChange('expectedAudience', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </FormSection>

                <FormSection icon="📍" title="Temporal & Spatial Data" color="secondary">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">Launch Date</label>
                      <input type="date" className="w-full bg-slate-50 border-0 outline-none rounded-2xl px-6 py-4 text-primary font-bold text-sm focus:ring-2 ring-primary/10 transition-all" value={formData.date} onChange={(e) => handleFormChange('date', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">Sync Time</label>
                      <input type="time" className="w-full bg-slate-50 border-0 outline-none rounded-2xl px-6 py-4 text-primary font-bold text-sm focus:ring-2 ring-primary/10 transition-all" value={formData.time} onChange={(e) => handleFormChange('time', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">Deployment Hub</label>
                      <input className="w-full bg-slate-50 border-0 outline-none rounded-2xl px-6 py-4 text-primary font-bold text-sm placeholder:text-slate-300 focus:ring-2 ring-primary/10 transition-all" placeholder="VENUE_IDENTIFIER" value={formData.location} onChange={(e) => handleFormChange('location', e.target.value)} />
                    </div>
                  </div>
                </FormSection>

                <FormSection icon="🎫" title="Acquisition Protocol" color="primary">
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex items-center gap-10 flex-wrap">
                    <div>
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">Entry Fee [INR]</label>
                      <input type="number" className="bg-white border-0 outline-none rounded-2xl px-6 py-4 text-primary font-black text-sm w-32 focus:ring-2 ring-primary/10 transition-all shadow-sm" placeholder="0.00" value={formData.regFee} onChange={(e) => handleFormChange('regFee', e.target.value)} />
                    </div>
                    <label className="flex items-center gap-4 cursor-pointer group">
                      <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center transition-all group-hover:border-primary">
                         <div className="w-3 h-3 rounded bg-primary opacity-0 group-hover:opacity-10 transition-opacity" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Global Node Access [All Hubs]</span>
                    </label>
                  </div>
                </FormSection>

                <FormSection icon="📝" title="Operational Directive" color="primary">
                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">Deployment Summary</label>
                      <textarea className="w-full bg-slate-50 border-0 outline-none rounded-[2rem] px-8 py-6 text-primary font-medium text-sm placeholder:text-slate-300 focus:ring-2 ring-primary/10 transition-all h-32 resize-none leading-relaxed" placeholder="Detailed mission parameters..." value={formData.description} onChange={(e) => handleFormChange('description', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 block">Engagement Protocols [Rules]</label>
                      <div className="space-y-3">
                        {formData.rules.map((rule, i) => (
                          <div key={i} className="flex gap-3">
                            <input className="w-full bg-slate-50 border-0 outline-none rounded-2xl px-6 py-4 text-primary font-medium text-sm focus:ring-2 ring-primary/10 transition-all" placeholder={`PROTOCOL_${i + 1}`} value={rule} onChange={(e) => handleArrayField('rules', i, e.target.value)} />
                            {formData.rules.length > 1 && (
                              <button onClick={() => removeArrayItem('rules', i)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </div>
                        ))}
                        <button onClick={() => addArrayItem('rules')} className="text-[9px] font-black text-primary uppercase tracking-[0.2em] hover:text-secondary transition-colors underline underline-offset-4 decoration-2">+ Append Protocol</button>
                      </div>
                    </div>
                  </div>
                </FormSection>

                <div className="flex items-center justify-between pt-10 border-t border-slate-50">
                   <button onClick={() => setShowCreateModal(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary transition-colors">Abort Mission</button>
                   <button onClick={handleSubmitEvent} className="bg-primary hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em] px-12 py-5 rounded-2xl transition-all shadow-2xl shadow-primary/20 flex items-center gap-3">
                     Finalize Proposal <TrendingUp className="w-4 h-4" />
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>

      {/* ===== PARTICIPANT DETAIL MODAL ===== */}
      <AnimatePresence>
        {selectedParticipant && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/20 backdrop-blur-xl"
            onClick={() => setSelectedParticipant(null)}
          >
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="bg-white rounded-[3.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative p-12 bg-slate-50/50 border-b border-slate-100">
                <button onClick={() => setSelectedParticipant(null)} className="absolute top-10 right-10 text-slate-300 hover:text-primary transition-colors"><X className="w-8 h-8" /></button>

                <div className="flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-white text-primary font-black text-4xl border border-slate-100 flex items-center justify-center shadow-2xl shadow-primary/5 mb-8">
                    {selectedParticipant.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <h3 className="text-primary font-black text-3xl tracking-tight mb-2">{selectedParticipant.name}</h3>
                  <div className="flex items-center gap-2 mb-8">
                      <span className="text-secondary font-black text-[10px] uppercase tracking-widest">{selectedParticipant.rollNumber}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{selectedParticipant.department} Hub</span>
                  </div>
                  
                  <span className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border flex items-center gap-2 ${
                    selectedParticipant.isCheckedIn ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-primary/5 text-primary border-primary/10'
                  }`}>
                    {selectedParticipant.isCheckedIn ? <><BadgeCheck className="w-4 h-4" /> STATUS: VERIFIED</> : 'STATUS: PENDING SYNC'}
                  </span>
                </div>
              </div>

              <div className="p-12 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Year/Semester', value: selectedParticipant.year || '—', color: 'text-primary' },
                    { label: 'Academic Sector', value: selectedParticipant.branch || '—', color: 'text-primary' },
                    { label: 'Contact Node', value: selectedParticipant.phone || '—', color: 'text-secondary', span: true },
                    { label: 'Identity Protocol [Email]', value: selectedParticipant.email, color: 'text-primary', span: true },
                  ].map((item, idx) => (
                    <div key={idx} className={`bg-slate-50 p-6 rounded-3xl border border-slate-50 ${item.span ? 'col-span-2' : ''}`}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
                      <p className={`font-black text-xs ${item.color} truncate`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-primary p-8 rounded-[2rem] text-white relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                      <QrCode className="w-20 h-20" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Internal Identity String</p>
                   <p className="font-mono text-[10px] font-bold tracking-tight">EVT-{selectedEventId}-STU-{selectedParticipant.studentId}</p>
                </div>

                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="w-full py-5 text-[10px] font-black text-primary uppercase tracking-[0.3em] border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all mt-4"
                >
                  Terminate Audit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ──── Sub Components ──── */

const StatCardNew = ({ title, value, icon, subtitle }: any) => (
  <div className="dashboard-card p-10 rounded-[3rem] border-slate-100 shadow-sm bg-white group hover:border-primary/20 transition-all">
    <div className="flex items-center gap-6 mb-8">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm border border-slate-100">
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
        <p className="text-primary text-3xl font-black tracking-tight">{value}</p>
      </div>
    </div>
    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{subtitle}</p>
  </div>
);

const FormSection = ({ icon, title, children }: { icon: string; title: string; color?: string; children: React.ReactNode }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-primary/[0.03] rounded-2xl flex items-center justify-center text-lg border border-primary/5 shadow-sm">{icon}</div>
        <h4 className="text-primary font-black text-sm uppercase tracking-[0.15em]">{title}</h4>
      </div>
      <div className="pl-14">
        {children}
      </div>
    </div>
  );
};

export default ClubDashboard;
