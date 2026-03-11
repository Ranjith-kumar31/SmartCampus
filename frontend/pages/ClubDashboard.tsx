import { useState, useEffect } from 'react';
import { LayoutDashboard, CalendarPlus, Users, QrCode, BarChart2, Settings, PlusCircle, Trash2, Clock, MapPin, CalendarDays, IndianRupee, X, TrendingUp, Pencil, ChevronDown, ChevronLeft, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layouts/DashboardLayout';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

const ANALYTICS_DATA = [
  { name: 'Mon', regs: 10 }, { name: 'Tue', regs: 25 }, { name: 'Wed', regs: 40 },
  { name: 'Thu', regs: 55 }, { name: 'Fri', regs: 80 }, { name: 'Sat', regs: 120 }, { name: 'Sun', regs: 150 }
];

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'overview' },
  { icon: CalendarPlus, label: 'Manage Events', id: 'events' },
  { icon: Users, label: 'Participants', id: 'participants' },
  { icon: QrCode, label: 'QR Scanner', id: 'scanner' },
  { icon: BarChart2, label: 'Analytics', id: 'analytics' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

const ClubDashboard = () => {
  const [activeView, setActiveView] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { name: 'Club', department: 'Unknown', id: '' };

  const [formData, setFormData] = useState({
    title: '', domain: '', date: '', time: '', location: '',
    expectedAudience: '', regFee: '0', description: '', rules: [''], prizes: [''],
  });

  const fetchClubEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await api.get('/events');
      const pendingRes = await api.get('/events/pending');
      const allEvents = [...res.data, ...pendingRes.data];
      const unique = allEvents.filter((e, i, s) => i === s.findIndex(x => x._id === e._id));
      const clubEvents = unique.filter((e: any) => e.club === user.id || e.club?._id === user.id);
      setEvents(clubEvents);
    } catch { console.error('Failed to fetch events'); }
    finally { setLoadingEvents(false); }
  };

  useEffect(() => { fetchClubEvents(); }, []);

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
      await api.post('/events', { ...formData, club: user.id, expectedAudience: parseInt(formData.expectedAudience, 10) || 0, regFee: parseInt(formData.regFee, 10) || 0, rules: formData.rules.filter(r => r.trim()), prizes: formData.prizes.filter(p => p.trim()) });
      toast.success('Event proposed! Pending admin approval.');
      setShowCreateModal(false);
      setFormData({ title: '', domain: '', date: '', time: '', location: '', expectedAudience: '', regFee: '0', description: '', rules: [''], prizes: [''] });
      fetchClubEvents();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to create event'); }
  };

  const handleDeleteEvent = async (id: string) => {
    try { await api.delete(`/events/${id}`); toast.success('Event deleted'); fetchClubEvents(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed to delete event'); }
  };

  const totalRegistrations = events.reduce((a, e) => a + (e.registeredStudents?.length || 0), 0);
  const totalRevenue = events.reduce((a, e) => a + ((e.registeredStudents?.length || 0) * (e.regFee || 0)), 0);

  return (
    <DashboardLayout
      title={`${user.name} Club Dashboard`}
      subtitle="Events"
      titleIcon={<span className="text-indigo-400 mr-1">&lt;&gt;</span>}
      navItems={navItems}
      activeView={activeView}
      onViewChange={setActiveView}
      userName={user.name || 'Club'}
      userRole="Club Lead"
      userId={user.id?.slice(-6)}
      searchPlaceholder="Search events, participants..."
      bottomWidget="support"
    >
      {/* ===== OVERVIEW ===== */}
      {activeView === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCardNew title="Total Registrations" value={String(totalRegistrations)} trend="+12.5%" trendUp icon={<Users className="w-5 h-5" />} subtitle="Growth compared to last month" accent="indigo" />
            <StatCardNew title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} trend="+8.2%" trendUp icon={<IndianRupee className="w-5 h-5" />} subtitle="Net earnings this quarter" accent="emerald" />
            <StatCardNew title="Total Events" value={String(events.length)} trend="— 0%" icon={<CalendarPlus className="w-5 h-5" />} subtitle="Scheduled for this semester" accent="violet" />
          </div>

          {/* Chart + Quick Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart */}
            <div className="lg:col-span-2 dashboard-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold">Registration Trends</h3>
                <button className="text-sm text-slate-400 bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.06] flex items-center gap-1.5 hover:bg-white/[0.06] transition-colors">
                  Last 7 Days <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ANALYTICS_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '13px' }} />
                    <Line type="monotone" dataKey="regs" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Overview */}
            <div className="dashboard-card p-6 space-y-6">
              <h3 className="text-white font-bold">Quick Overview</h3>
              <div className="space-y-5">
                <MetricCircle value={78} label="Capacity Reach" sublabel="Average across all events" color="indigo" />
                <MetricCircle value={92} label="Payment Success" sublabel="All gateway transactions" color="emerald" />
              </div>
              <div className="pt-4 border-t border-white/[0.06]">
                <h4 className="text-indigo-400 text-[10px] uppercase tracking-widest font-bold mb-3">Recent Activity</h4>
                <div className="space-y-3 text-sm">
                  <ActivityDot text={<><strong>Aarav Kumar</strong> registered for "Web-A-Thon 2024"</>} />
                  <ActivityDot text={<>Event <strong>"UI/UX Workshop"</strong> was approved by admin</>} />
                </div>
              </div>
            </div>
          </div>

          {/* Active Events Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Active Events</h3>
              <button className="text-indigo-400 text-sm font-medium hover:text-indigo-300">View All Events</button>
            </div>
            <div className="dashboard-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">Event Name</th>
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">Date</th>
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">Participants</th>
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">Status</th>
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {events.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">No events yet. Create one!</td></tr>
                  ) : events.map((event: any) => (
                    <tr key={event._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                            {event.title?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-medium">{event.title}</p>
                            <p className="text-slate-500 text-xs">{event.domain} • {event.time}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{event.date}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex -space-x-2">
                          {[...Array(Math.min(event.registeredStudents?.length || 0, 3))].map((_, i) => (
                            <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 ring-2 ring-[#0c1021] flex items-center justify-center text-[10px] text-white font-semibold">{i + 1}</div>
                          ))}
                          {(event.registeredStudents?.length || 0) > 3 && (
                            <div className="w-7 h-7 rounded-full bg-white/[0.08] ring-2 ring-[#0c1021] flex items-center justify-center text-[10px] text-slate-300">+{event.registeredStudents.length - 3}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                          event.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          event.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>{event.status}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 text-slate-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteEvent(event._id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== MANAGE EVENTS ===== */}
      {activeView === 'events' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Manage Events</h2>
            <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
              <PlusCircle className="w-4 h-4" /> Create Event
            </button>
          </div>
          {loadingEvents ? (
            <div className="dashboard-card p-16 text-center text-slate-500">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="dashboard-card flex flex-col items-center justify-center py-20 text-slate-400">
              <CalendarPlus className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Events Yet</h3>
              <p className="mb-6 max-w-sm text-center text-sm">Create your first event and start accepting registrations.</p>
              <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Create Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {events.map((event: any) => (
                <div key={event._id} className="dashboard-card p-5 hover:border-indigo-500/20 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-white font-bold">{event.title}</h3>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                        event.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                        event.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>{event.status}</span>
                    </div>
                    <button onClick={() => handleDeleteEvent(event._id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">{event.description}</p>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5 text-slate-500" /> {event.date}</div>
                    <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-500" /> {event.time}</div>
                    <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {event.location}</div>
                    <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-slate-500" /> {event.registeredStudents?.length || 0} / {event.expectedAudience} registered</div>
                    {event.regFee > 0 && <div className="flex items-center gap-2"><IndianRupee className="w-3.5 h-3.5 text-emerald-400" /> ₹{event.regFee} per student</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ===== EVENT PARTICIPANTS ===== */}
      {activeView === 'participants' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto relative pb-32">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 relative px-1">
            <button className="text-white p-1 -ml-1 hover:bg-white/[0.06] rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-white leading-tight">
              Event Participants
            </h2>
            <button className="text-white p-1 hover:bg-white/[0.06] rounded-full transition-colors">
              <span className="text-xl">🔍</span>
            </button>
          </div>

          {/* Stats Box Row */}
          <div className="flex gap-4 mb-5">
            <div className="dashboard-card p-4 flex-1">
              <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">Total Registered</p>
              <p className="text-indigo-500 text-3xl font-bold">247</p>
            </div>
            <div className="dashboard-card p-4 flex-1">
              <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">Checked In</p>
              <div className="flex items-baseline gap-2">
                <p className="text-emerald-500 text-3xl font-bold">142</p>
                <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-xs font-bold">57%</span>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <input type="text" className="input-field pl-10 h-11 bg-white/[0.02] border-white/[0.04]" placeholder="Name or roll number..." />
              <span className="absolute left-3 top-2.5 text-slate-500">🔍</span>
            </div>
            <button className="w-11 h-11 bg-white/[0.04] border border-white/[0.06] rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none px-1">
            <button className="bg-indigo-600 text-white font-medium text-sm px-5 py-2 rounded-full whitespace-nowrap shadow-lg shadow-indigo-500/20">All</button>
            <button className="bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.06] font-medium text-sm px-5 py-2 rounded-full whitespace-nowrap">CS</button>
            <button className="bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.06] font-medium text-sm px-5 py-2 rounded-full whitespace-nowrap">Electrical</button>
            <button className="bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.06] font-medium text-sm px-5 py-2 rounded-full whitespace-nowrap">Mechanical</button>
          </div>

          {/* Select All */}
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-5 h-5 rounded-[4px] border border-white/20 bg-white/[0.02]"></div>
            <span className="text-sm font-medium text-slate-300">Select All</span>
          </div>

          {/* List items */}
          <div className="space-y-3">
            {[
              { id: '1', name: 'Alex Rivera', desc: 'CS-2021-042 • 3rd Year', status: 'CHECKED IN', color: 'bg-indigo-500/20 text-indigo-400', img: 'https://i.pravatar.cc/150?u=alex', isCheckedIn: true },
              { id: '2', name: 'Sarah Koenig', desc: 'ME-2022-118 • 2nd Year', status: 'REGISTERED', color: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30', init: 'SK', isCheckedIn: false },
              { id: '3', name: 'Michael Chen', desc: 'CS-2021-089 • 3rd Year', status: 'CHECKED IN', color: 'bg-pink-500/20 text-pink-400', img: 'https://i.pravatar.cc/150?u=michael', isCheckedIn: true },
              { id: '4', name: 'Jordan Parker', desc: 'EE-2023-012 • 1st Year', status: 'REGISTERED', color: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30', init: 'JP', isCheckedIn: false },
              { id: '5', name: 'Emily Watson', desc: 'CS-2021-112 • 3rd Year', status: 'CHECKED IN', color: 'bg-orange-500/20 text-orange-400', img: 'https://i.pravatar.cc/150?u=emily', isCheckedIn: true }
            ].map(s => (
              <div key={s.id} className="dashboard-card p-4 flex items-center gap-3 sm:gap-4">
                <div className="w-5 h-5 rounded-[4px] border border-white/20 bg-white/[0.02] shrink-0"></div>
                {s.img ? (
                  <img src={s.img} alt={s.name} className="w-12 h-12 rounded-full object-cover shrink-0 border border-white/10" />
                ) : (
                  <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-bold text-lg ${s.color}`}>
                    {s.init}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-sm truncate">{s.name}</h4>
                  <p className="text-slate-400 text-xs truncate mt-0.5">{s.desc}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className={`px-2 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-md ${
                    s.isCheckedIn ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                  }`}>
                    {s.status}
                  </span>
                  <button className="text-slate-400 hover:text-white p-1">
                    <span className="text-lg">⋮</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sticky FAB & Bottom Actions */}
          <div className="fixed bottom-0 left-0 w-full z-50 flex flex-col items-center">
            {/* FAB */}
            <div className="w-full max-w-md flex justify-end px-4 mb-4 pointer-events-none">
              <button className="bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 text-white font-semibold py-3 px-5 rounded-2xl flex items-center gap-2 pointer-events-auto">
                <UserCheck className="w-5 h-5" /> Bulk Check-in
              </button>
            </div>
            
            {/* Bottom Nav */}
            <div className="w-full max-w-md bg-[#080b14]/95 backdrop-blur-xl border-t border-white/[0.04]">
              <div className="flex justify-around py-3">
                <button className="text-indigo-500 p-2"><LayoutDashboard className="w-6 h-6" /></button>
                <button className="text-slate-400 hover:text-white p-2"><Users className="w-6 h-6" /></button>
                <button className="text-slate-400 hover:text-white p-2"><CalendarDays className="w-6 h-6" /></button>
                <button className="text-slate-400 hover:text-white p-2"><Settings className="w-6 h-6" /></button>
              </div>
              
              {/* Export Full Width Button */}
              <div className="p-3 pt-1 pointer-events-auto">
                <button className="w-full bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <span className="text-lg">↓</span> Export CSV
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== QR SCANNER ===== */}
      {activeView === 'scanner' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto relative pb-20">
          <div className="flex items-center justify-center mb-6 relative">
            <h2 className="text-xl font-bold text-white">QR Ticket Scanner</h2>
            <button className="absolute right-0 w-9 h-9 bg-white/[0.04] hover:bg-white/[0.08] rounded-full flex items-center justify-center text-white transition-colors">🔦</button>
          </div>

          {/* Scanner UI */}
          <div className="dashboard-card p-6 flex flex-col items-center justify-center mb-6 relative overflow-hidden h-[300px]">
             {/* Glow overlay */}
             <div className="absolute inset-0 bg-indigo-500/5 backdrop-blur-[2px]"></div>
             
             {/* Scanner Box */}
             <div className="w-64 h-64 relative z-10">
                {/* Scanner corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                
                {/* Scan Line */}
                <div className="absolute top-1/4 left-0 w-full h-1 bg-indigo-400 shadow-[0_0_20px_4px_rgba(99,102,241,0.8)] animate-[scan_2.5s_ease-in-out_infinite]"></div>
             </div>
          </div>
          
          <p className="text-white text-center font-medium mb-6">Align QR code within the frame to scan</p>

          <div className="dashboard-card p-5 mb-4 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-bold text-sm">Auto Check-in</p>
                <p className="text-slate-400 text-xs mt-0.5">Automatically process tickets on scan</p>
              </div>
              {/* Toggle switch mock */}
              <div className="w-12 h-6 bg-indigo-500 rounded-full flex justify-end p-0.5 shadow-inner">
                <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
              </div>
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
              ⌨ Enter Ticket ID Manually
            </button>
          </div>

          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Recently Scanned</h3>
            <button className="text-indigo-400 font-bold text-xs hover:text-indigo-300">View All</button>
          </div>

          <div className="space-y-3">
             <div className="dashboard-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0c1021] border border-white/5 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">👤</div>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Sarah Jenkins</h4>
                    <p className="text-slate-500 text-[10px] uppercase tracking-wide mt-0.5">ID: #SC-90421-B</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">2m ago</span>
                  <div className="w-5 h-5 bg-emerald-500 text-[#0f1328] flex items-center justify-center rounded-full text-[10px] font-bold shrink-0">✓</div>
                </div>
             </div>
             
             <div className="dashboard-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0c1021] border border-white/5 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">👤</div>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">David Miller</h4>
                    <p className="text-slate-500 text-[10px] uppercase tracking-wide mt-0.5">ID: #SC-88123-X</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">5m ago</span>
                  <div className="w-5 h-5 bg-emerald-500 text-[#0f1328] flex items-center justify-center rounded-full text-[10px] font-bold shrink-0">✓</div>
                </div>
             </div>
          </div>
        </motion.div>
      )}

      {/* ===== ANALYTICS ===== */}
      {activeView === 'analytics' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-xl font-bold text-white mb-5">Analytics</h2>
          <div className="dashboard-card p-8 text-center text-slate-500">Advanced analytics coming soon.</div>
        </motion.div>
      )}

      {/* ===== SETTINGS ===== */}
      {activeView === 'settings' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-xl font-bold text-white mb-5">Settings</h2>
          <div className="dashboard-card p-8 text-center text-slate-500">Settings coming soon.</div>
        </motion.div>
      )}

      {/* ===== PROFILE ===== */}
      {activeView === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <h2 className="text-xl font-bold text-white">Club Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 dashboard-card p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-indigo-600/20 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                <span className="text-4xl font-bold text-indigo-400 uppercase">{user.name?.charAt(0)}</span>
              </div>
              <h3 className="text-white text-lg font-bold">{user.name}</h3>
              <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mt-1">Official Club</p>
              
              <div className="mt-6 pt-6 border-t border-white/[0.04] space-y-4 text-left">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Affiliated Dept</p>
                  <p className="text-slate-200 text-sm">{user.department}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Club ID</p>
                  <p className="text-slate-200 text-sm font-mono">{user.id?.toUpperCase() || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="dashboard-card p-6">
                <h3 className="text-white font-bold mb-4">Club Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                    <p className="text-slate-500 text-xs mb-1">Hosted Events</p>
                    <p className="text-2xl font-bold text-white">{events.length}</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                    <p className="text-slate-500 text-xs mb-1">Total Registrations</p>
                    <p className="text-2xl font-bold text-white">{totalRegistrations}</p>
                  </div>
                </div>
              </div>

              <div className="dashboard-card p-6">
                <h3 className="text-white font-bold mb-4">About Club</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  The {user.name} club is dedicated to fostering excellence and creativity within the {user.department} community. 
                  We organize technical and non-technical events to enhance student skills and engagement across the campus.
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="dashboard-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative"
              onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowCreateModal(false)} className="absolute top-5 right-5 text-slate-500 hover:text-white z-10"><X className="w-5 h-5" /></button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                  <CalendarPlus className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Create New Event</h3>
                  <p className="text-slate-500 text-sm">Draft a proposal for your next club activity</p>
                </div>
              </div>

              <div className="space-y-6 mt-6">
                {/* Basic Info */}
                <FormSection icon="ℹ" title="Basic Info" color="indigo">
                  <div>
                    <label className="form-label">Event Title</label>
                    <input className="input-field" placeholder="e.g. Annual Hackathon 2024" value={formData.title} onChange={(e) => handleFormChange('title', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Category/Domain</label>
                      <select className="input-field appearance-none" value={formData.domain} onChange={(e) => handleFormChange('domain', e.target.value)}>
                        <option value="" disabled className="bg-[#0c1021]">Select Domain</option>
                        {['AI & ML', 'AI & DS', 'Web Development', 'Cybersecurity', 'Robotics', 'Cultural', 'Sports', 'General'].map(d => (
                          <option key={d} value={d} className="bg-[#0c1021]">{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Expected Audience</label>
                      <input type="number" className="input-field" placeholder="Approx. headcount" value={formData.expectedAudience} onChange={(e) => handleFormChange('expectedAudience', e.target.value)} />
                    </div>
                  </div>
                </FormSection>

                {/* Logistics */}
                <FormSection icon="📍" title="Logistics" color="amber">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">Date</label>
                      <input type="date" className="input-field" value={formData.date} onChange={(e) => handleFormChange('date', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Start Time</label>
                      <input type="time" className="input-field" value={formData.time} onChange={(e) => handleFormChange('time', e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Location/Venue</label>
                      <input className="input-field" placeholder="Main Auditorium" value={formData.location} onChange={(e) => handleFormChange('location', e.target.value)} />
                    </div>
                  </div>
                </FormSection>

                {/* Registration */}
                <FormSection icon="🎫" title="Registration" color="emerald">
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] flex items-center gap-4 flex-wrap">
                    <div>
                      <label className="form-label">Registration Fee (₹)</label>
                      <input type="number" className="input-field w-40 bg-indigo-600/10 border-indigo-500/20" placeholder="₹ 0.00" value={formData.regFee} onChange={(e) => handleFormChange('regFee', e.target.value)} />
                    </div>
                    <label className="flex items-center gap-2 text-slate-400 text-sm cursor-pointer">
                      <input type="checkbox" className="form-checkbox rounded bg-white/[0.04] border-white/[0.1]" /> Open to all departments
                    </label>
                  </div>
                </FormSection>

                {/* Content */}
                <FormSection icon="📝" title="Content" color="violet">
                  <div>
                    <label className="form-label">Description</label>
                    <textarea className="input-field resize-none h-24" placeholder="Describe the event..." value={formData.description} onChange={(e) => handleFormChange('description', e.target.value)} />
                  </div>
                  {/* Rules */}
                  <div>
                    <label className="form-label">Event Rules</label>
                    <div className="space-y-2">
                      {formData.rules.map((rule, i) => (
                        <div key={i} className="flex gap-2">
                          <input className="input-field flex-1" placeholder={`Rule ${i + 1}`} value={rule} onChange={(e) => handleArrayField('rules', i, e.target.value)} />
                          {formData.rules.length > 1 && (
                            <button onClick={() => removeArrayItem('rules', i)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addArrayItem('rules')} className="text-sm text-indigo-400 hover:text-indigo-300">+ Add Rule</button>
                    </div>
                  </div>
                  {/* Prizes */}
                  <div>
                    <label className="form-label">Prizes (optional)</label>
                    <div className="space-y-2">
                      {formData.prizes.map((prize, i) => (
                        <div key={i} className="flex gap-2">
                          <input className="input-field flex-1" placeholder={`Prize ${i + 1} (e.g., ₹5000 + Certificate)`} value={prize} onChange={(e) => handleArrayField('prizes', i, e.target.value)} />
                          {formData.prizes.length > 1 && (
                            <button onClick={() => removeArrayItem('prizes', i)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addArrayItem('prizes')} className="text-sm text-indigo-400 hover:text-indigo-300">+ Add Prize</button>
                    </div>
                  </div>
                </FormSection>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold">
                    <span>🔒</span> Secured by Smart Campus
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowCreateModal(false)} className="px-6 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleSubmitEvent} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20">
                      <ChevronDown className="w-4 h-4 rotate-[-90deg]" /> Propose Event
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

/* ──── Sub Components ──── */

const StatCardNew = ({ title, value, trend, trendUp, icon, subtitle, accent }: any) => (
  <div className="dashboard-card p-5">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg ${accent === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : accent === 'violet' ? 'bg-violet-500/10 text-violet-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
        {icon}
      </div>
      {trend && (
        <span className={`text-xs font-bold flex items-center gap-0.5 ${trendUp ? 'text-emerald-400' : 'text-slate-500'}`}>
          {trendUp && <TrendingUp className="w-3.5 h-3.5" />} {trend}
        </span>
      )}
    </div>
    <p className="text-slate-500 text-xs mb-0.5">{title}</p>
    <p className="text-white text-3xl font-bold mb-1">{value}</p>
    <p className="text-slate-500 text-xs">{subtitle}</p>
  </div>
);

const MetricCircle = ({ value, label, sublabel, color }: any) => {
  const circumference = 2 * Math.PI * 24;
  const offset = circumference - (value / 100) * circumference;
  const colorClass = color === 'emerald' ? 'text-emerald-400' : 'text-indigo-400';
  const strokeColor = color === 'emerald' ? '#10b981' : '#6366f1';
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          <circle cx="28" cy="28" r="24" fill="none" stroke={strokeColor} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${colorClass}`}>{value}%</span>
      </div>
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-slate-500 text-xs">{sublabel}</p>
      </div>
    </div>
  );
};

const ActivityDot = ({ text }: { text: React.ReactNode }) => (
  <div className="flex items-start gap-2.5">
    <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
    <span className="text-slate-400 text-xs leading-relaxed">{text}</span>
  </div>
);

const FormSection = ({ icon, title, color, children }: { icon: string; title: string; color: string; children: React.ReactNode }) => {
  const colorMap: Record<string, string> = { indigo: 'text-indigo-400', amber: 'text-amber-400', emerald: 'text-emerald-400', violet: 'text-violet-400' };
  return (
    <div className="space-y-4">
      <h4 className={`flex items-center gap-2 font-bold text-sm ${colorMap[color] || 'text-white'}`}>
        <span>{icon}</span> {title}
      </h4>
      {children}
    </div>
  );
};

export default ClubDashboard;
