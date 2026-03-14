import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, FileCheck, BarChart2, FileText, Settings, TrendingUp, MoreHorizontal, CalendarPlus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layouts/DashboardLayout';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

// Attach HOD JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

const navItems = [
  { icon: FileCheck,   label: 'OD Requests',       id: 'requests'  },
  { icon: CalendarPlus, label: 'Event Approvals',   id: 'events'    },
  { icon: BarChart2,   label: 'Department Analytics', id: 'analytics' },
  { icon: FileText,    label: 'Reports',            id: 'reports'   },
  { icon: Settings,    label: 'Settings',           id: 'settings'  },
];

const getUser = () => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } };

const HODdashboard = () => {
  const user = getUser();

  const [activeTab, setActiveTab] = useState('requests');
  const [searchTerm, setSearchTerm] = useState('');

  // OD state
  const [odRequests, setOdRequests] = useState<any[]>([]);
  const [loadingOD, setLoadingOD] = useState(true);

  // Event approvals state
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarkAction, setRemarkAction] = useState<'Approved' | 'Rejected'>('Approved');

  /* ── Fetch OD requests ── */
  const fetchPendingODs = async () => {
    setLoadingOD(true);
    try {
      const res = await api.get('/od/pending');
      setOdRequests(res.data);
    } catch {
      toast.error('Failed to load OD requests');
    } finally {
      setLoadingOD(false);
    }
  };

  /* ── Fetch pending events for this HOD's department ── */
  const fetchPendingEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await api.get('/events/hod-pending');
      setPendingEvents(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load pending events');
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => { fetchPendingODs(); }, []);

  useEffect(() => {
    if (activeTab === 'events') fetchPendingEvents();
  }, [activeTab]);

  /* ── OD approve/reject ── */
  const handleODAction = async (id: string, status: string) => {
    try {
      await api.patch(`/od/${id}/status`, { status, remarks: `${status} by HOD` });
      toast.success(`OD Request ${status}!`);
      fetchPendingODs();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  /* ── Open remarks modal before event approval ── */
  const openEventAction = (event: any, action: 'Approved' | 'Rejected') => {
    setSelectedEvent(event);
    setRemarkAction(action);
    setRemarks('');
    setShowRemarksModal(true);
  };

  /* ── Confirm event approve/reject ── */
  const confirmEventAction = async () => {
    if (!selectedEvent) return;
    const eventId = selectedEvent.id || selectedEvent._id;
    try {
      await api.patch(`/events/${eventId}/hod-approve`, {
        status: remarkAction,
        remarks: remarks.trim() || `${remarkAction} by HOD - ${user.department} Department`,
      });
      toast.success(`Event "${selectedEvent.title}" ${remarkAction}! ${remarkAction === 'Approved' ? '✅ It is now live on Smart Campus.' : '❌'}`);
      setShowRemarksModal(false);
      setSelectedEvent(null);
      fetchPendingEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update event');
    }
  };

  /* ── Derived values ── */
  const filteredODs = odRequests.filter((req: any) =>
    (req.student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (req.student?.rollNumber || '').includes(searchTerm) ||
    (req.event?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const approvedCount = odRequests.filter(r => r.status === 'Approved').length;
  const rejectedCount = odRequests.filter(r => r.status === 'Rejected').length;
  const pendingODCount = odRequests.filter(r => r.status === 'Pending').length;
  const totalCount = odRequests.length;
  const approvalRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  const OD_STATS = [
    { name: 'Approved', value: approvedCount || 1,  color: '#6366f1', pct: totalCount > 0 ? Math.round((approvedCount/totalCount)*100) : 80 },
    { name: 'Pending',  value: pendingODCount || 1, color: '#f59e0b', pct: totalCount > 0 ? Math.round((pendingODCount/totalCount)*100) : 12 },
    { name: 'Rejected', value: rejectedCount || 1,  color: '#ef4444', pct: totalCount > 0 ? Math.round((rejectedCount/totalCount)*100) : 8  },
  ];

  return (
    <DashboardLayout
      title={`HOD Portal — ${user.department} Dept`}
      subtitle="Event Management"
      titleIcon={<span className="mr-1">🎓</span>}
      navItems={navItems}
      activeView={activeTab}
      onViewChange={setActiveTab}
      userName={user.name || 'HOD'}
      userRole={`Head of ${user.department}`}
      userId={user.id?.slice(-6)}
      searchPlaceholder="Search OD requests..."
      bottomWidget="profile"
    >
      <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        {/* ===== OD REQUESTS ===== */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <HodStatCard title="Total ODs Processed" value={String(totalCount || 0)} trend={undefined} icon={<CheckCircle className="w-5 h-5" />} accent="emerald" />
              <HodStatCard title="Approval Rate"       value={`${approvalRate}%`}       trend={undefined} icon={<TrendingUp className="w-5 h-5" />} accent="indigo" />
              <HodStatCard title="Pending Review"      value={String(pendingODCount)}   trend={undefined} icon={<Clock className="w-5 h-5" />}      accent="amber"  />
            </div>

            {/* OD Table + Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 dashboard-card overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <h3 className="text-white font-bold">Pending OD Requests</h3>
                  <span className="text-xs text-slate-500">{filteredODs.length} requests</span>
                </div>

                {/* Search */}
                <div className="px-5 pt-3 pb-2">
                  <input
                    type="text"
                    className="input-field h-9 text-sm"
                    placeholder="Search by student or event..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>

                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Student</th>
                      <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Event</th>
                      <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Status</th>
                      <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {loadingOD ? (
                      <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
                    ) : filteredODs.length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No pending OD requests.</td></tr>
                    ) : filteredODs.map((req: any) => (
                      <tr key={req._id || req.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="text-white font-medium">{req.student?.name || 'Unknown'}</p>
                          <p className="text-slate-500 text-[10px] mt-0.5">
                            {req.student?.rollNumber || 'N/A'} • {req.registration?.year || 'N/A'} {req.registration?.branch ? `(${req.registration.branch})` : ''}
                          </p>
                          {req.registration?.phone && <p className="text-slate-600 text-[9px] mt-0.5 whitespace-nowrap">📞 {req.registration.phone}</p>}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-slate-300 text-sm">{req.event?.title || 'N/A'}</p>
                          <p className="text-slate-500 text-xs">{req.reason?.slice(0, 40)}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Pending
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-2">
                            <button onClick={() => handleODAction(req._id || req.id, 'Approved')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleODAction(req._id || req.id, 'Rejected')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Status Donut */}
              <div className="dashboard-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold">OD Status Overview</h3>
                  <button className="text-slate-500 hover:text-white"><MoreHorizontal className="w-5 h-5" /></button>
                </div>
                <div className="h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={OD_STATS} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                        {OD_STATS.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-white">{totalCount}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Total ODs</span>
                  </div>
                </div>
                <div className="space-y-2.5 mt-2">
                  {OD_STATS.map(stat => (
                    <div key={stat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stat.color }} />
                        <span className="text-slate-400">{stat.name}</span>
                      </div>
                      <span className="text-white font-bold">{stat.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== EVENT APPROVALS ===== */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            {/* Header with badge */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Event Approvals</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Review and approve event proposals from <span className="text-indigo-400 font-semibold">{user.department}</span> department clubs
                </p>
              </div>
              {pendingEvents.length > 0 && (
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold px-3 py-1.5 rounded-full">
                  {pendingEvents.length} Pending
                </span>
              )}
            </div>

            {/* Info Banner */}
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <p className="text-indigo-300 font-semibold text-sm">Approval Flow</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Events submitted by clubs in the <strong className="text-slate-300">{user.department}</strong> department appear here for your review.
                  When you approve an event, it becomes <strong className="text-emerald-400">live on Smart Campus</strong> for all students to see and register.
                  Rejected events are notified to the club.
                </p>
              </div>
            </div>

            {/* Loading / Empty */}
            {loadingEvents ? (
              <div className="dashboard-card p-16 text-center">
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500">Loading pending events...</p>
              </div>
            ) : pendingEvents.length === 0 ? (
              <div className="dashboard-card p-16 text-center space-y-2">
                <CalendarPlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-white font-medium">No Pending Event Proposals</p>
                <p className="text-slate-500 text-sm">All events from {user.department} clubs have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingEvents.map((event: any) => {
                  const evtId = event.id || event._id;
                  return (
                  <div key={evtId} className="dashboard-card p-5">
                    {/* Club badge + date */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                            {event.club?.name || 'Unknown Club'}
                          </span>
                          <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                            Pending HOD Review
                          </span>
                        </div>
                        <h3 className="text-white font-bold text-lg">{event.title}</h3>
                        <p className="text-slate-400 text-sm mt-1 line-clamp-2">{event.description}</p>
                      </div>
                    </div>

                    {/* Event details grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <InfoCell icon="📅" label="Date" value={event.date || 'TBD'} />
                      <InfoCell icon="🕐" label="Time" value={event.time || 'TBD'} />
                      <InfoCell icon="📍" label="Venue" value={event.location || 'TBD'} />
                      <InfoCell icon="👥" label="Expected" value={`${event.expectedAudience ?? event.expected_audience ?? '—'} students`} />
                      <InfoCell icon="🏷️" label="Domain" value={event.domain || '—'} />
                      <InfoCell icon="💳" label="Reg Fee" value={event.regFee || event.reg_fee ? `₹${event.regFee || event.reg_fee}` : 'Free'} />
                      <InfoCell icon="👤" label="Coordinator" value={event.club?.coordinator || '—'} />
                      <InfoCell icon="📧" label="Club Email" value={event.club?.email || '—'} />
                    </div>

                    {/* Rules / Prizes (if any) */}
                    {event.rules?.length > 0 && (
                      <div className="mb-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Rules</p>
                        <ul className="space-y-1">
                          {event.rules.slice(0, 3).map((r: string, i: number) => (
                            <li key={i} className="text-slate-400 text-xs flex items-start gap-2">
                              <span className="text-indigo-400 shrink-0">{i + 1}.</span> {r}
                            </li>
                          ))}
                          {event.rules.length > 3 && (
                            <li className="text-slate-600 text-xs">+{event.rules.length - 3} more...</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-3 border-t border-white/[0.06]">
                      <button
                        onClick={() => openEventAction(event, 'Approved')}
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve — Go Live
                      </button>
                      <button
                        onClick={() => openEventAction(event, 'Rejected')}
                        className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-xl transition-colors border border-red-500/20 flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="dashboard-card p-8 text-center text-slate-500">Department analytics coming soon.</div>
        )}
        {activeTab === 'reports' && (
          <div className="dashboard-card p-8 text-center text-slate-500">Reports module coming soon.</div>
        )}
        {activeTab === 'settings' && (
          <div className="dashboard-card p-8 text-center text-slate-500">Settings coming soon.</div>
        )}

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="text-xl font-bold text-white">Academic Administrator Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 dashboard-card p-6 text-center">
                <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-xl shadow-emerald-500/5">
                  <span className="text-4xl font-bold text-emerald-400 uppercase">{user.name?.charAt(0)}</span>
                </div>
                <h3 className="text-white text-lg font-bold">{user.name}</h3>
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mt-1">Head of Department</p>
                <div className="mt-6 pt-6 border-t border-white/[0.04] space-y-4 text-left">
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Department</p>
                    <p className="text-slate-200 text-sm">{user.department}</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-6">
                <div className="dashboard-card p-6">
                  <h3 className="text-white font-bold mb-4">Department Snapshot</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      <p className="text-slate-500 text-xs mb-1">Pending OD Requests</p>
                      <p className="text-2xl font-bold text-amber-400">{pendingODCount}</p>
                    </div>
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      <p className="text-slate-500 text-xs mb-1">Pending Event Proposals</p>
                      <p className="text-2xl font-bold text-indigo-400">{pendingEvents.length}</p>
                    </div>
                  </div>
                </div>
                <div className="dashboard-card p-6">
                  <h3 className="text-white font-bold mb-4">Administrator Privileges</h3>
                  <ul className="space-y-3">
                    {[
                      'Approve/Reject student On-Duty (OD) requests',
                      `Approve event proposals from ${user.department} department clubs`,
                      'Approved events go live immediately on Smart Campus',
                      'Access department event analytics',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-400 text-sm">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </motion.div>

      {/* ===== REMARKS MODAL ===== */}
      <AnimatePresence>
        {showRemarksModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowRemarksModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="dashboard-card w-full max-w-md p-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${remarkAction === 'Approved' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                {remarkAction === 'Approved'
                  ? <CheckCircle className="w-6 h-6 text-emerald-400" />
                  : <XCircle className="w-6 h-6 text-red-400" />}
              </div>

              <h3 className="text-white text-lg font-bold mb-1">
                {remarkAction === 'Approved' ? 'Approve Event' : 'Reject Event'}
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                <span className="text-white font-semibold">"{selectedEvent.title}"</span>
                {remarkAction === 'Approved'
                  ? ' will go live on Smart Campus immediately.'
                  : ' will be rejected and the club will be notified.'}
              </p>

              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Remarks <span className="text-slate-600 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  className="input-field resize-none h-24 text-sm"
                  placeholder={remarkAction === 'Approved'
                    ? 'e.g. Approved. Ensure venue is booked and notified to students.'
                    : 'e.g. Please re-submit with a detailed schedule and faculty coordinator sign-off.'}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowRemarksModal(false)} className="flex-1 py-2.5 text-slate-400 hover:text-white text-sm font-medium transition-colors border border-white/[0.06] rounded-xl">
                  Cancel
                </button>
                <button
                  onClick={confirmEventAction}
                  className={`flex-1 py-2.5 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    remarkAction === 'Approved'
                      ? 'bg-emerald-500 hover:bg-emerald-400'
                      : 'bg-red-500 hover:bg-red-400'
                  }`}
                >
                  {remarkAction === 'Approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  Confirm {remarkAction}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

/* ──── Sub Components ──── */

const HodStatCard = ({ title, value, trend, trendUp, icon, accent }: any) => {
  const accents: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    indigo:  'bg-indigo-500/10 text-indigo-400',
    amber:   'bg-amber-500/10 text-amber-400',
  };
  return (
    <div className="dashboard-card p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-slate-500 text-xs font-medium">{title}</p>
        <div className={`p-2 rounded-lg ${accents[accent]}`}>{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-white text-3xl font-bold">{value}</p>
        {trend && <span className={`text-xs font-bold ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>{trend}</span>}
      </div>
    </div>
  );
};

const InfoCell = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
    <div className="flex items-center gap-1.5 mb-1">
      <span className="text-sm">{icon}</span>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
    </div>
    <p className="text-slate-200 text-sm font-medium truncate">{value}</p>
  </div>
);

export default HODdashboard;
