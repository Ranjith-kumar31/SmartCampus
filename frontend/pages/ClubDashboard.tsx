import { useState, useEffect } from 'react';
import { LayoutDashboard, CalendarPlus, Users, QrCode, BarChart2, Settings, PlusCircle, Trash2, Clock, MapPin, CalendarDays, IndianRupee, X, TrendingUp } from 'lucide-react';
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
  { icon: LayoutDashboard, label: 'Dashboard', id: 'overview' },
  { icon: CalendarPlus, label: 'Manage Events', id: 'events' },
  { icon: Users, label: 'Participants', id: 'participants' },
  { icon: QrCode, label: 'QR Scanner', id: 'scanner' },
  { icon: BarChart2, label: 'Analytics', id: 'analytics' },
  { icon: Settings, label: 'Settings', id: 'settings' },
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

  // QR Scanner state
  const [scannerEventId, setScannerEventId] = useState<string>('');
  const [scannedLog, setScannedLog] = useState<any[]>([]);
  const [manualTicket, setManualTicket] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
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
  const handleManualScan = () => {
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

    const alreadyScanned = scannedLog.find(s => s.studentId === studentId && s.eventId === currentEventId);
    if (alreadyScanned) {
      toast('Already checked in!', { icon: '⚠️' });
      return;
    }

    const logEntry = {
      studentId,
      eventId: currentEventId,
      name: participant.name,
      rollNumber: participant.rollNumber,
      department: participant.department,
      scannedAt: new Date(),
    };
    setScannedLog(prev => [logEntry, ...prev]);
    toast.success(`✅ ${participant.name} checked in!`);
    setManualTicket('');
    setShowManualInput(false);
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
          {/* Stat Cards — real data */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCardNew title="Total Registrations" value={String(totalRegistrations)} icon={<Users className="w-5 h-5" />} subtitle="Across all your events" accent="indigo" />
            <StatCardNew title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={<IndianRupee className="w-5 h-5" />} subtitle="From paid event registrations" accent="emerald" />
            <StatCardNew title="Total Events" value={String(events.length)} icon={<CalendarPlus className="w-5 h-5" />} subtitle={`${approvedEvents.length} approved, ${events.filter(e => e.status === 'Pending').length} pending`} accent="violet" />
          </div>

          {/* Chart — real per-event registrations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 dashboard-card p-6">
              <h3 className="text-white font-bold mb-6">Registrations per Event</h3>
              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No approved events yet</div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '13px' }} />
                      <Line type="monotone" dataKey="regs" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Quick Overview — real numbers */}
            <div className="dashboard-card p-6 space-y-6">
              <h3 className="text-white font-bold">Quick Overview</h3>
              <div className="space-y-4">
                {events.length > 0 ? (
                  events.slice(0, 4).map(e => (
                    <div key={e.id || e._id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <div className="min-w-0">
                        <p className="text-slate-200 text-sm font-medium truncate">{e.title}</p>
                        <p className="text-slate-500 text-xs">{e.date}</p>
                      </div>
                      <span className={`ml-3 shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        e.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                        e.status === 'Rejected' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>{e.status}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm italic">No events created yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Active Events Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">My Events</h3>
              <button onClick={() => setActiveView('events')} className="text-indigo-400 text-sm font-medium hover:text-indigo-300">Manage Events →</button>
            </div>
            <div className="dashboard-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">Event Name</th>
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">Date</th>
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">Registrations</th>
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">Status</th>
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loadingEvents ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Loading events...</td></tr>
                  ) : events.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">No events yet. Create one!</td></tr>
                  ) : events.map((event: any) => {
                    const eId = event.id || event._id;
                    return (
                    <tr key={eId} className="hover:bg-white/[0.02] transition-colors">
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
                      <td className="px-5 py-3.5 text-slate-300 font-semibold">
                        {event.registration_count ?? 0}
                        <span className="text-slate-500 font-normal"> / {event.expectedAudience ?? event.expected_audience ?? '—'}</span>
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
                          <button onClick={() => handleDeleteEvent(eId)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
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
              {events.map((event: any) => {
                const eId = event.id || event._id;
                return (
                <div key={eId} className="dashboard-card p-5 hover:border-indigo-500/20 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-white font-bold">{event.title}</h3>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                        event.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                        event.status === 'Rejected' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>{event.status}</span>
                    </div>
                    <button onClick={() => handleDeleteEvent(eId)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">{event.description}</p>
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5 text-slate-500" /> {event.date}</div>
                    <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-500" /> {event.time}</div>
                    <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {event.location}</div>
                    <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-semibold text-white">{event.registration_count ?? 0}</span>
                      <span>/ {event.expectedAudience ?? event.expected_audience ?? '—'} registered</span>
                    </div>
                    {(event.regFee || event.reg_fee) > 0 && (
                      <div className="flex items-center gap-2"><IndianRupee className="w-3.5 h-3.5 text-emerald-400" /> ₹{event.regFee || event.reg_fee} per student</div>
                    )}
                  </div>
                  {event.status === 'Approved' && (
                    <button
                      onClick={() => { setSelectedEventId(eId); setActiveView('participants'); }}
                      className="mt-4 w-full py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-xs font-semibold transition-colors border border-indigo-500/20"
                    >
                      View {event.registration_count ?? 0} Participants →
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Event Participants</h2>
          </div>

          {/* Event selector */}
          <div className="dashboard-card p-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Event</label>
            <select
              className="input-field"
              value={selectedEventId}
              onChange={e => { setSelectedEventId(e.target.value); setParticipantSearch(''); setDeptFilter('All'); }}
            >
              <option value="" className="bg-[#0c1021]">— Choose an event —</option>
              {events.map(e => (
                <option key={e.id || e._id} value={e.id || e._id} className="bg-[#0c1021]">
                  {e.title} ({e.status}) — {e.date}
                </option>
              ))}
            </select>
          </div>

          {/* Stats for selected event */}
          {selectedEvent && (
            <div className="flex gap-4">
              <div className="dashboard-card p-4 flex-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Total Registered</p>
                <p className="text-indigo-400 text-3xl font-bold">{participants.length}</p>
              </div>
              <div className="dashboard-card p-4 flex-1">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Checked In (QR)</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-emerald-400 text-3xl font-bold">
                    {scannedLog.filter(s => s.eventId === selectedEventId).length}
                  </p>
                  {participants.length > 0 && (
                    <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-xs font-bold">
                      {Math.round((scannedLog.filter(s => s.eventId === selectedEventId).length / participants.length) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search and Dept filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                className="input-field pl-10 h-11 bg-white/[0.02] border-white/[0.04]"
                placeholder="Search by name or roll number..."
                value={participantSearch}
                onChange={e => setParticipantSearch(e.target.value)}
              />
              <span className="absolute left-3 top-2.5 text-slate-500">🔍</span>
            </div>
          </div>

          {/* Department filter tabs */}
          {departments.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => setDeptFilter(dept)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    deptFilter === dept
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.06]'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          )}

          {/* Participants list — real data */}
          {!selectedEventId ? (
            <div className="dashboard-card p-12 text-center text-slate-500">Select an event above to view participants.</div>
          ) : loadingParticipants ? (
            <div className="dashboard-card p-12 text-center text-slate-500">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
              Loading participants...
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="dashboard-card p-12 text-center text-slate-500">
              {participants.length === 0
                ? 'No students have registered for this event yet.'
                : 'No participants match your search.'}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-500 text-xs px-1">Showing {filteredParticipants.length} of {participants.length} participants</p>
              {filteredParticipants.map((p, i) => {
                const isCheckedIn = scannedLog.some(s => s.studentId === p.studentId && s.eventId === selectedEventId);
                return (
                  <div key={p.studentId || i} className="dashboard-card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg shrink-0">
                      {p.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold text-sm truncate">{p.name}</h4>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {p.rollNumber} · {p.department}
                      </p>
                      <p className="text-slate-600 text-[10px] mt-0.5">
                        Registered: {new Date(p.registeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md shrink-0 ${
                      isCheckedIn ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {isCheckedIn ? 'CHECKED IN' : 'REGISTERED'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ===== QR SCANNER ===== */}
      {activeView === 'scanner' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto space-y-5 pb-10">
          <h2 className="text-xl font-bold text-white text-center">QR Ticket Scanner</h2>

          {/* Event selector for scanner */}
          <div className="dashboard-card p-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Scan tickets for event</label>
            <select
              className="input-field"
              value={scannerEventId}
              onChange={e => { setScannerEventId(e.target.value); setScannedLog([]); }}
            >
              <option value="" className="bg-[#0c1021]">— Choose an event —</option>
              {events.filter(e => e.status === 'Approved').map(e => (
                <option key={e.id || e._id} value={e.id || e._id} className="bg-[#0c1021]">
                  {e.title} — {e.date}
                </option>
              ))}
            </select>
          </div>

          {/* Scanner viewport */}
          <div className="dashboard-card p-6 flex flex-col items-center justify-center relative overflow-hidden h-[280px]">
            <div className="absolute inset-0 bg-indigo-500/5 backdrop-blur-[2px]" />
            <div className="w-56 h-56 relative z-10">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-xl shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              <div className="absolute top-1/4 left-0 w-full h-0.5 bg-indigo-400 shadow-[0_0_20px_4px_rgba(99,102,241,0.8)] animate-[scan_2.5s_ease-in-out_infinite]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2">
                <QrCode className="w-10 h-10 text-indigo-400/40" />
                <p className="text-slate-500 text-xs">
                  {scannerEventId ? 'Use manual entry below' : 'Select an event first'}
                </p>
              </div>
            </div>
          </div>

          <p className="text-slate-400 text-center text-sm">Align QR code within the frame to scan</p>

          {/* Auto check-in toggle + manual entry */}
          <div className="dashboard-card p-5 border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">Auto Check-in</p>
                <p className="text-slate-400 text-xs mt-0.5">Automatically log tickets on scan</p>
              </div>
              <button
                onClick={() => setAutoCheckin(!autoCheckin)}
                className={`w-12 h-6 rounded-full flex items-center p-0.5 transition-all ${autoCheckin ? 'bg-indigo-500 justify-end' : 'bg-white/10 justify-start'}`}
              >
                <div className="w-5 h-5 bg-white rounded-full shadow-md" />
              </button>
            </div>

            {/* Manual entry */}
            <AnimatePresence>
              {showManualInput ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-2">
                  <p className="text-xs text-slate-500">Format: <span className="font-mono text-indigo-400">EVT-{'<eventId>'}-STU-{'<studentId>'}</span></p>
                  <div className="flex gap-2">
                    <input
                      className="input-field flex-1 text-sm"
                      placeholder="Paste ticket code here..."
                      value={manualTicket}
                      onChange={e => setManualTicket(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleManualScan()}
                    />
                    <button onClick={handleManualScan} className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors">Go</button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <button
              onClick={() => setShowManualInput(!showManualInput)}
              disabled={!scannerEventId}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed active:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              ⌨ {showManualInput ? 'Hide Manual Entry' : 'Enter Ticket ID Manually'}
            </button>
          </div>

          {/* Stats for selected scanner event */}
          {scannerEventId && (
            <div className="grid grid-cols-2 gap-3">
              <div className="dashboard-card p-3 text-center">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Registered</p>
                <p className="text-white text-2xl font-bold">{participants.length}</p>
              </div>
              <div className="dashboard-card p-3 text-center">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Checked In</p>
                <p className="text-emerald-400 text-2xl font-bold">
                  {scannedLog.filter(s => s.eventId === scannerEventId).length}
                </p>
              </div>
            </div>
          )}

          {/* Recently scanned — only real scans */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                Scanned This Session ({scannedLog.filter(s => s.eventId === scannerEventId).length})
              </h3>
              {scannedLog.length > 0 && (
                <button onClick={() => setScannedLog([])} className="text-red-400 text-xs hover:text-red-300">Clear</button>
              )}
            </div>

            {scannedLog.filter(s => s.eventId === scannerEventId).length === 0 ? (
              <div className="dashboard-card p-8 text-center text-slate-500 text-sm">
                No check-ins yet this session.
              </div>
            ) : (
              <div className="space-y-3">
                {scannedLog.filter(s => s.eventId === scannerEventId).map((s, i) => (
                  <div key={i} className="dashboard-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-sm border border-emerald-500/20">
                        {s.name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">{s.name}</h4>
                        <p className="text-slate-500 text-[10px] uppercase tracking-wide mt-0.5">
                          {s.rollNumber} · {s.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">
                        {new Date(s.scannedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="w-5 h-5 bg-emerald-500 text-[#0f1328] flex items-center justify-center rounded-full text-[10px] font-bold">✓</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

                <FormSection icon="📝" title="Content" color="violet">
                  <div>
                    <label className="form-label">Description</label>
                    <textarea className="input-field resize-none h-24" placeholder="Describe the event..." value={formData.description} onChange={(e) => handleFormChange('description', e.target.value)} />
                  </div>
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

                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold">
                    <span>🔒</span> Secured by Smart Campus
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowCreateModal(false)} className="px-6 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleSubmitEvent} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20">
                      Propose Event →
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
