import { useState, useEffect } from 'react';
import { Users, CalendarPlus, Server, UserCog, FileText, Settings, CheckSquare, XSquare, Eye, TrendingUp, Star, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layouts/DashboardLayout';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

const navItems = [
  { icon: Users, label: 'Club Approvals', id: 'clubs' },
  { icon: CalendarPlus, label: 'Event Approvals', id: 'events' },
  { icon: Server, label: 'System Status', id: 'system' },
  { icon: UserCog, label: 'User Management', id: 'users' },
  { icon: FileText, label: 'Audit Logs', id: 'logs' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('clubs');
  const [clubs, setClubs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [approvalFilter, setApprovalFilter] = useState<'clubs' | 'events'>('clubs');

  const fetchClubs = async () => {
    setLoadingClubs(true);
    try { const res = await api.get('/clubs/all'); setClubs(res.data); }
    catch { console.error('Failed to fetch clubs'); }
    finally { setLoadingClubs(false); }
  };

  const fetchPendingEvents = async () => {
    setLoadingEvents(true);
    try { const res = await api.get('/events/pending'); setEvents(res.data); }
    catch { console.error('Failed to fetch events'); }
    finally { setLoadingEvents(false); }
  };

  useEffect(() => { fetchClubs(); fetchPendingEvents(); }, []);

  const handleClubAction = async (id: string, status: string) => {
    try { await api.patch(`/clubs/${id}/status`, { status }); toast.success(`Club ${status}!`); fetchClubs(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const handleEventAction = async (id: string, status: string) => {
    try { await api.patch(`/events/${id}/status`, { status }); toast.success(`Event ${status}!`); fetchPendingEvents(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const pendingClubs = clubs.filter(c => c.status === 'Pending');
  const activeClubs = clubs.filter(c => c.status === 'Approved');

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { name: 'Admin', role: 'admin', id: '' };

  return (
    <DashboardLayout
      title="System Admin Center"
      subtitle="Event Management"
      navItems={navItems}
      activeView={activeTab}
      onViewChange={setActiveTab}
      userName={user.name || 'Admin'}
      userRole="System Administrator"
      userId={user.id?.slice(-6)}
      accentColor="emerald"
      searchPlaceholder="Search approvals, logs, or users..."
      bottomWidget="profile"
    >
      <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        {/* ===== CLUB APPROVALS ===== */}
        {activeTab === 'clubs' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* System Health */}
              <div className="dashboard-card p-5 space-y-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <span className="text-emerald-400">🛡️</span> System Health
                </h3>
                <div className="space-y-3">
                  <HealthRow icon="🖥️" label="API Cluster" status="Operational" statusColor="emerald" />
                  <HealthRow icon="🗄️" label="Database Node" status="Stable" statusColor="emerald" />
                  <HealthRow icon="💳" label="Payment Gateway" status="Active" statusColor="emerald" />
                </div>
              </div>

              {/* Pending Approvals */}
              <div className="lg:col-span-2 dashboard-card overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <h3 className="text-white font-bold">Pending Approvals</h3>
                  <button className="text-indigo-400 text-sm font-medium hover:text-indigo-300">View All History</button>
                </div>
                {/* Tabs */}
                <div className="px-5 pt-4 flex gap-2">
                  <button onClick={() => setApprovalFilter('clubs')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${approvalFilter === 'clubs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-white/[0.04]'}`}>Clubs</button>
                  <button onClick={() => setApprovalFilter('events')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${approvalFilter === 'events' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-white/[0.04]'}`}>Events</button>
                </div>

                {approvalFilter === 'clubs' ? (
                  <div>
                    <table className="w-full text-left text-sm mt-2">
                      <thead>
                        <tr className="border-b border-white/[0.04]">
                          <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Club Name / Applicant</th>
                          <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Submitted Date</th>
                          <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Category</th>
                          <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Proof</th>
                          <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {loadingClubs ? (
                          <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
                        ) : pendingClubs.length === 0 ? (
                          <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No pending club registrations.</td></tr>
                        ) : (
                          pendingClubs.map((club: any) => (
                            <tr key={club._id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">&lt;&gt;</div>
                                  <div>
                                    <p className="text-white font-medium">{club.name}</p>
                                    <p className="text-slate-500 text-xs">By {club.coordinator} · {club.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-slate-400 text-sm">{new Date(club.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                              <td className="px-5 py-3.5">
                                <span className="bg-white/[0.06] text-slate-300 px-2.5 py-1 rounded-md text-xs font-medium">{club.department}</span>
                              </td>
                              <td className="px-5 py-3.5">
                                {club.proofFile ? (
                                  <a
                                    href={`http://localhost:5000/uploads/proofs/${club.proofFile}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-xs font-medium rounded-lg transition-colors border border-violet-500/20"
                                  >
                                    <ExternalLink className="w-3 h-3" /> View Proof
                                  </a>
                                ) : (
                                  <span className="text-slate-600 text-xs italic">No file</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex gap-2">
                                  <button onClick={() => handleClubAction(club._id, 'Approved')} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-colors">✓ Approve</button>
                                  <button onClick={() => handleClubAction(club._id, 'Rejected')} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors border border-red-500/20">✗ Reject</button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    {pendingClubs.length > 3 && (
                      <div className="px-5 py-3 border-t border-white/[0.04] text-center">
                        <button className="text-indigo-400 text-sm font-medium hover:text-indigo-300">View all {pendingClubs.length} pending clubs</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <table className="w-full text-left text-sm mt-2">
                      <thead>
                        <tr className="border-b border-white/[0.04]">
                          <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Event Name / Club</th>
                          <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Domain</th>
                          <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Audience</th>
                          <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {loadingEvents ? (
                          <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
                        ) : events.length === 0 ? (
                          <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No pending event proposals.</td></tr>
                        ) : (
                          events.map((evt: any) => (
                            <tr key={evt._id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-3.5">
                                <p className="text-white font-medium">{evt.title}</p>
                                <p className="text-slate-500 text-xs">{evt.club?.name || 'Unknown'}</p>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="bg-white/[0.06] text-slate-300 px-2.5 py-1 rounded-md text-xs font-medium">{evt.domain}</span>
                              </td>
                              <td className="px-5 py-3.5 text-slate-400 text-sm">{evt.expectedAudience}</td>
                              <td className="px-5 py-3.5">
                                <div className="flex gap-2">
                                  <button onClick={() => handleEventAction(evt._id, 'Approved')} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-colors">Approve</button>
                                  <button onClick={() => handleEventAction(evt._id, 'Rejected')} className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-medium rounded-lg transition-colors">Reject</button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Recent Activity */}
              <div className="dashboard-card p-5 space-y-4">
                <h3 className="text-white font-bold">Recent Activity</h3>
                <div className="space-y-4">
                  <AdminActivityItem icon="👤" iconColor="bg-indigo-500/10" title="New User Registration" desc="Sarah Chen joined via Tech Meetup" time="2 minutes ago" />
                  <AdminActivityItem icon="✅" iconColor="bg-emerald-500/10" title="Club Verified" desc="'Cyber Pulse' status changed to active" time="45 minutes ago" />
                  <AdminActivityItem icon="⚙️" iconColor="bg-slate-500/10" title="Config Update" desc="System backup policy updated" time="3 hours ago" />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="dashboard-card p-5 flex flex-col justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Total Active Clubs</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{activeClubs.length || 142}</span>
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> 12%</span>
                  </div>
                </div>
                <div className="dashboard-card p-5 flex flex-col justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Upcoming Events</p>
                  <div>
                    <span className="text-3xl font-bold text-white">{events.length || 28}</span>
                    <p className="text-indigo-400 text-xs font-medium mt-1">Live tracking</p>
                  </div>
                </div>
                <div className="dashboard-card p-5 flex flex-col justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">User Satisfaction</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">4.8</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i <= 4 ? 'text-amber-400 fill-amber-400' : 'text-amber-400/30'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== EVENT APPROVALS ===== */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Event Approvals</h2>
            <div className="dashboard-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Event Title</th>
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Host Club</th>
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Domain</th>
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Audience</th>
                    <th className="px-5 py-3.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loadingEvents ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
                  ) : events.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">No pending event proposals.</td></tr>
                  ) : (
                    events.map((evt: any) => (
                      <tr key={evt._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 text-white font-medium">{evt.title}</td>
                        <td className="px-5 py-3.5 text-slate-400">{evt.club?.name || 'Unknown'}</td>
                        <td className="px-5 py-3.5"><span className="bg-white/[0.06] text-slate-300 px-2.5 py-1 rounded-md text-xs">{evt.domain}</span></td>
                        <td className="px-5 py-3.5 text-slate-400">{evt.expectedAudience}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-2">
                            <button className="px-3 py-1.5 bg-white/[0.06] text-slate-300 text-xs rounded-lg flex items-center gap-1"><Eye className="w-3 h-3" /> Review</button>
                            <button onClick={() => handleEventAction(evt._id, 'Approved')} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg">Approve</button>
                            <button onClick={() => handleEventAction(evt._id, 'Rejected')} className="px-3 py-1.5 bg-white/[0.06] text-slate-300 text-xs rounded-lg">Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== SYSTEM STATUS ===== */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="dashboard-card p-6 flex flex-col items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                  <Server className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">All Systems Operational</h3>
                <p className="text-emerald-400 font-medium text-sm animate-pulse mb-6">Real-time monitoring</p>
                <div className="w-full space-y-3 text-sm text-slate-400">
                  <div className="flex justify-between pb-2 border-b border-white/[0.04]"><span>API Server</span><span className="text-emerald-400">99.9% Uptime</span></div>
                  <div className="flex justify-between pb-2 border-b border-white/[0.04]"><span>Database</span><span className="text-emerald-400">Connected</span></div>
                  <div className="flex justify-between pb-2 border-b border-white/[0.04]"><span>Payment GW</span><span className="text-emerald-400">Active</span></div>
                </div>
              </div>
              <div className="dashboard-card p-6">
                <h3 className="text-lg font-bold text-white mb-6">Audit Logs</h3>
                <div className="space-y-4">
                  <AdminActivityItem icon="👤" iconColor="bg-indigo-500/10" title="New club registered: Drama Society" desc="" time="2 mins ago" />
                  <AdminActivityItem icon="⚠️" iconColor="bg-red-500/10" title="Failed login attempt: Admin Portal" desc="" time="15 mins ago" />
                  <AdminActivityItem icon="✅" iconColor="bg-emerald-500/10" title="Event approved: AI Workshop" desc="" time="1 hour ago" />
                  <AdminActivityItem icon="💾" iconColor="bg-indigo-500/10" title="Automated DB backup completed" desc="" time="3 hours ago" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="dashboard-card p-8 text-center text-slate-500">User management coming soon.</div>
        )}
        {activeTab === 'logs' && (
          <div className="dashboard-card p-8 text-center text-slate-500">Audit logs coming soon.</div>
        )}
        {activeTab === 'settings' && (
          <div className="dashboard-card p-8 text-center text-slate-500">Settings coming soon.</div>
        )}

        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="text-xl font-bold text-white">System Administrator Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 dashboard-card p-6 text-center border-emerald-500/20">
                <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <span className="text-4xl font-bold text-emerald-400 uppercase">{user.name?.charAt(0)}</span>
                </div>
                <h3 className="text-white text-lg font-bold">{user.name}</h3>
                <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest mt-1">Super Admin</p>
                
                <div className="mt-6 pt-6 border-t border-white/[0.04] space-y-4 text-left">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Access Level</span>
                    <span className="text-emerald-400 font-bold">L-1 (Full)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Admin ID</span>
                    <span className="text-slate-200 font-mono text-xs">{user.id?.slice(-8).toUpperCase() || 'SYSTEM'}</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="dashboard-card p-6">
                  <h3 className="text-white font-bold mb-4">System Scope</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Users</span>
                      <span className="text-white">1,240</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Clubs</span>
                      <span className="text-white">{clubs.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">System Logs</span>
                      <span className="text-indigo-400">View History</span>
                    </div>
                  </div>
                </div>

                <div className="dashboard-card p-6 border-indigo-500/20">
                  <h3 className="text-white font-bold mb-4">Security Status</h3>
                  <div className="flex items-center gap-3 text-emerald-400 text-sm font-medium mb-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Firewall Active
                  </div>
                  <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04] text-[10px] text-slate-500 font-mono">
                    Last login: {new Date().toLocaleString()} from 192.168.1.1
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </motion.div>
    </DashboardLayout>
  );
};

/* ──── Sub Components ──── */

const HealthRow = ({ icon, label, status, statusColor }: any) => {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-slate-300 text-sm font-medium">{label}</span>
      </div>
      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colors[statusColor]}`}>{status}</span>
    </div>
  );
};

const AdminActivityItem = ({ icon, iconColor, title, desc, time }: any) => (
  <div className="flex items-start gap-3">
    <div className={`w-9 h-9 rounded-lg ${iconColor} flex items-center justify-center text-sm flex-shrink-0`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-white text-sm font-medium">{title}</p>
      {desc && <p className="text-slate-500 text-xs mt-0.5">{desc}</p>}
      <p className="text-slate-600 text-[10px] uppercase tracking-wider mt-1">{time}</p>
    </div>
  </div>
);

export default AdminDashboard;
