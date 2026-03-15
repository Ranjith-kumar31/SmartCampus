import { useState, useEffect } from 'react';
import { Users, CalendarPlus, Server, UserCog, FileText, Settings, Eye, TrendingUp, Star, ExternalLink, ShieldCheck, Activity, Globe, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

// Attach the admin JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});


const navItems = [
  { icon: Users, label: 'Club Approvals', id: 'clubs' },
  { icon: CalendarPlus, label: 'Event Approvals', id: 'events' },
  { icon: Server, label: 'System Status', id: 'system' },
  { icon: UserCog, label: 'User Management', id: 'users' },
  { icon: FileText, label: 'Audit Logs', id: 'logs' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('clubs');
  const [clubs, setClubs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [approvalFilter, setApprovalFilter] = useState<'clubs' | 'events'>('clubs');

  // Redirect to login if token is missing or rejected by the server
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) {
      navigate('/auth/admin', { replace: true });
      return;
    }
    try {
      const parsed = JSON.parse(user);
      if (parsed?.role !== 'admin') {
        navigate('/auth/admin', { replace: true });
      }
    } catch {
      navigate('/auth/admin', { replace: true });
    }
  }, []);

  // Handle 401 / 403 from any API call — session expired or not admin
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401) {
          toast.error('Session expired. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/auth/admin', { replace: true });
        } else if (error.response?.status === 403) {
          toast.error('Access denied. Admin privileges required.');
          navigate('/', { replace: true });
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, [navigate]);

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

  const handleClubAction = async (id: string, status: 'Approved' | 'Rejected', name?: string) => {
    try {
      await api.patch(`/clubs/${id}/status`, { status });
      toast.success(`Club "${name || ''}" ${status}! ✅`);
      fetchClubs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleEventAction = async (id: string, status: string) => {
    try { await api.patch(`/events/${id}/status`, { status }); toast.success(`Event ${status}!`); fetchPendingEvents(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const pendingClubs = clubs.filter(c => c.status === 'Pending');
  const activeClubs = clubs.filter(c => c.status === 'Approved');

  const getUserFromStorage = () => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  };
  const user = getUserFromStorage();


  return (
    <DashboardLayout
      title="Admin Control Unit"
      subtitle="System Governance"
      navItems={navItems}
      activeView={activeTab}
      onViewChange={setActiveTab}
      userName={user.name || 'Administrator'}
      userRole="System Governance Head"
      userId={user.id?.slice(-6).toUpperCase()}
      accentColor="primary"
      searchPlaceholder="Lookup assets, credentials, logs..."
      bottomWidget="profile"
    >
      <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

        {/* ===== CLUB APPROVALS & REVIEWS ===== */}
        {activeTab === 'clubs' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* System Governance Panel */}
              <div className="lg:col-span-4 space-y-6">
                <div className="dashboard-card p-8 space-y-8 rounded-[2.5rem] border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                     <ShieldCheck className="w-24 h-24" />
                  </div>
                  <div>
                    <h3 className="text-primary font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       Governance Status
                    </h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                      All system modules are operating within established performance parameters.
                    </p>
                  </div>
                  
                  <div className="space-y-5">
                    <HealthRow icon={<Activity className="w-4 h-4" />} label="API Cluster" status="Stable" statusColor="emerald" />
                    <HealthRow icon={<Server className="w-4 h-4" />} label="Database Node" status="Optimized" statusColor="emerald" />
                    <HealthRow icon={<Globe className="w-4 h-4" />} label="Gateway" status="Active" statusColor="emerald" />
                  </div>

                  <div className="pt-6 border-t border-slate-50">
                     <button className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-primary font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all">
                        Full Diagnostics
                     </button>
                  </div>
                </div>

                {/* Growth Stats */}
                <div className="dashboard-card p-8 rounded-[2.5rem] border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-6">Network Expansion</p>
                    <div className="flex items-end justify-between">
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 mb-1">Total Active Entities</p>
                          <p className="text-4xl font-black text-primary">{activeClubs.length || 142}</p>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="text-emerald-500 font-black text-xs flex items-center gap-1 mb-1">
                             <TrendingUp className="w-3 h-3" /> +12%
                          </span>
                          <span className="text-[9px] text-slate-300 font-bold">vs last month</span>
                       </div>
                    </div>
                </div>
              </div>

              {/* Main Approvals Table */}
              <div className="lg:col-span-8">
                <div className="dashboard-card overflow-hidden rounded-[2.5rem] border-slate-100 shadow-sm min-h-[500px] flex flex-col">
                  <div className="px-10 py-8 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-primary font-black text-xl tracking-tight">Access Approvals</h3>
                        <p className="text-slate-400 font-medium text-sm">Reviewing new entity registrations</p>
                    </div>
                    {/* Tabs / Filter Toggle */}
                    <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1 self-stretch sm:self-auto">
                      <button 
                        onClick={() => setApprovalFilter('clubs')} 
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${approvalFilter === 'clubs' ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-primary'}`}
                      >Clubs</button>
                      <button 
                        onClick={() => setApprovalFilter('events')} 
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${approvalFilter === 'events' ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-primary'}`}
                      >Events</button>
                    </div>
                  </div>

                  <div className="flex-1">
                    {approvalFilter === 'clubs' ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50/50">
                              <th className="px-10 py-5 text-[10px] uppercase tracking-[0.1em] text-slate-400 font-black">Identity / Source</th>
                              <th className="px-10 py-5 text-[10px] uppercase tracking-[0.1em] text-slate-400 font-black">Timeline</th>
                              <th className="px-10 py-5 text-[10px] uppercase tracking-[0.1em] text-slate-400 font-black">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {loadingClubs ? (
                              <tr><td colSpan={3} className="px-10 py-20 text-center"><span className="w-8 h-8 border-4 border-slate-100 border-t-primary rounded-full animate-spin inline-block" /></td></tr>
                            ) : pendingClubs.length === 0 ? (
                              <tr><td colSpan={3} className="px-10 py-20 text-center text-slate-400 font-bold">Queue clear. No pending club registrations.</td></tr>
                            ) : (
                              pendingClubs.map((club: any) => {
                                const clubId = club.id || club._id;
                                return (
                                <tr key={clubId} className="hover:bg-slate-50/30 transition-colors group">
                                  <td className="px-10 py-6">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary font-black text-sm shadow-sm group-hover:scale-110 transition-transform">
                                        {club.name?.charAt(0)}
                                      </div>
                                      <div>
                                        <p className="text-primary font-black text-sm">{club.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                           <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100 group-hover:bg-primary group-hover:text-white transition-colors">{club.department}</span>
                                           <p className="text-slate-400 text-xs font-medium">By {club.coordinator}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-10 py-6 text-slate-500 font-bold text-xs uppercase tracking-wider">
                                    {club.created_at ? new Date(club.created_at).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="px-10 py-6">
                                    <div className="flex gap-3">
                                      {club.proofFile && (
                                        <button 
                                          onClick={() => window.open(`http://localhost:5000/uploads/proofs/${club.proofFile}`, '_blank')}
                                          className="p-3 bg-slate-50 hover:bg-primary/5 text-slate-400 hover:text-primary rounded-xl transition-all border border-slate-100"
                                          title="View Credentials"
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleClubAction(clubId, 'Approved', club.name)}
                                        className="px-6 py-2.5 bg-primary hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary/10"
                                      >Approve</button>
                                      <button
                                        onClick={() => handleClubAction(clubId, 'Rejected', club.name)}
                                        className="px-6 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                      >Decline</button>
                                    </div>
                                  </td>
                                </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50/50">
                              <th className="px-10 py-5 text-[10px] uppercase tracking-[0.1em] text-slate-400 font-black">Strategic Intent</th>
                              <th className="px-10 py-5 text-[10px] uppercase tracking-[0.1em] text-slate-400 font-black">Domain</th>
                              <th className="px-10 py-5 text-[10px] uppercase tracking-[0.1em] text-slate-400 font-black">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {loadingEvents ? (
                              <tr><td colSpan={3} className="px-10 py-20 text-center"><span className="w-8 h-8 border-4 border-slate-100 border-t-primary rounded-full animate-spin inline-block" /></td></tr>
                            ) : events.length === 0 ? (
                              <tr><td colSpan={3} className="px-10 py-20 text-center text-slate-400 font-bold">No event proposals in queue.</td></tr>
                            ) : (
                              events.map((evt: any) => {
                                const evtId = evt.id || evt._id;
                                return (
                                <tr key={evtId} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="px-10 py-6">
                                    <p className="text-primary font-black text-sm">{evt.title}</p>
                                    <p className="text-slate-400 text-xs mt-1 font-bold italic">{evt.club?.name || 'Authorized Entity'}</p>
                                  </td>
                                  <td className="px-10 py-6">
                                    <span className="bg-primary/5 text-primary border border-primary/10 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{evt.domain}</span>
                                  </td>
                                  <td className="px-10 py-6">
                                    <div className="flex gap-2">
                                      <button onClick={() => handleEventAction(evtId, 'Approved')} className="px-6 py-2.5 bg-primary hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary/10">Authorize</button>
                                      <button onClick={() => handleEventAction(evtId, 'Rejected')} className="px-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Reject</button>
                                    </div>
                                  </td>
                                </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row Audit & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               {/* Audit Logs Preview */}
               <div className="lg:col-span-8">
                  <div className="dashboard-card p-10 rounded-[2.5rem] border-slate-100">
                     <div className="flex items-center justify-between mb-10">
                        <div>
                           <h3 className="text-primary font-black text-xl tracking-tight">Governance Logs</h3>
                           <p className="text-slate-400 font-medium text-sm">Real-time system activity transparency</p>
                        </div>
                        <button className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 px-6 py-3 rounded-2xl hover:bg-primary/10 transition-all">Download Audit</button>
                     </div>
                     <div className="space-y-6">
                        <AdminActivityItem icon={<UserCog className="w-4 h-4" />} iconColor="bg-slate-50 text-primary border border-slate-100" title="System Configuration Update" desc="Security firewall rules updated by Head Admin" time="2 minutes ago" />
                        <AdminActivityItem icon={<CheckCircle className="w-4 h-4" />} iconColor="bg-emerald-50 text-emerald-600 border border-emerald-100" title="Club Authorization Granted" desc="'Quantum Codes' registration validated and activated" time="45 minutes ago" />
                        <AdminActivityItem icon={<FileText className="w-4 h-4" />} iconColor="bg-slate-50 text-slate-400 border border-slate-100" title="Automated Maintenance Completed" desc="Database indexing and cache clearance finalized" time="3 hours ago" />
                     </div>
                  </div>
               </div>

               {/* Quality Rating */}
               <div className="lg:col-span-4">
                  <div className="dashboard-card p-10 rounded-[2.5rem] border-slate-100 flex flex-col justify-center h-full">
                     <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-10">System Satisfaction Index</p>
                     <div className="mb-4">
                        <span className="text-6xl font-black text-primary">4.8</span>
                        <span className="text-slate-300 font-black text-2xl">/5.0</span>
                     </div>
                     <div className="flex gap-2 mb-8">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`w-5 h-5 ${i <= 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-100 fill-slate-100'}`} />
                        ))}
                     </div>
                     <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        Top-tier performance metrics across all campus departments.
                     </p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* ===== EVENT APPROVALS (Stand-alone View) ===== */}
        {activeTab === 'events' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-primary font-black text-2xl tracking-tight">Event Strategy Review</h2>
              <p className="text-slate-500 font-medium mt-1">Authorize or reject proposed high-tier campus events</p>
            </div>
            <div className="dashboard-card overflow-hidden rounded-[2.5rem] border-slate-100 shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-10 py-6 text-[10px] uppercase font-black tracking-widest text-slate-400">Strategic Event</th>
                    <th className="px-10 py-6 text-[10px] uppercase font-black tracking-widest text-slate-400">Promoter Entity</th>
                    <th className="px-10 py-6 text-[10px] uppercase font-black tracking-widest text-slate-400">Target Audience</th>
                    <th className="px-10 py-6 text-[10px] uppercase font-black tracking-widest text-slate-400">Action Center</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loadingEvents ? (
                    <tr><td colSpan={4} className="px-10 py-20 text-center"><span className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin inline-block" /></td></tr>
                  ) : events.length === 0 ? (
                    <tr><td colSpan={4} className="px-10 py-20 text-center text-slate-400 font-black">Queue empty. No strategic proposals found.</td></tr>
                  ) : (
                    events.map((evt: any) => {
                      const evtId = evt.id || evt._id;
                      return (
                      <tr key={evtId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-8">
                          <p className="text-primary font-black text-sm">{evt.title}</p>
                          <span className="text-[10px] bg-primary/5 text-primary border border-primary/10 px-2.5 py-1 rounded-lg font-black uppercase tracking-widest mt-2 inline-block">{evt.domain}</span>
                        </td>
                        <td className="px-10 py-8 text-slate-400 font-bold text-sm">{evt.club?.name || 'Verified Hub'}</td>
                        <td className="px-10 py-8 text-primary font-black text-sm">{evt.expected_audience ?? evt.expectedAudience ?? 'N/A'}</td>
                        <td className="px-10 py-8">
                          <div className="flex gap-3">
                            <button className="p-3 bg-slate-50 hover:bg-primary/5 text-slate-400 hover:text-primary rounded-xl transition-all border border-slate-100"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => handleEventAction(evtId, 'Approved')} className="px-6 py-2.5 bg-primary hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/10 transition-all">Authorize</button>
                            <button onClick={() => handleEventAction(evtId, 'Rejected')} className="px-6 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Deny</button>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== SYSTEM DIAGNOSTICS ===== */}
        {activeTab === 'system' && (
          <div className="space-y-8">
            <h2 className="text-primary font-black text-2xl tracking-tight">System Diagnostic Hub</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="dashboard-card p-12 flex flex-col items-center justify-center rounded-[3rem] border-slate-100">
                <div className="w-32 h-32 rounded-[2.5rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/10">
                  <ShieldCheck className="w-14 h-14 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-black text-primary mb-4 tracking-tight">Core Operational</h3>
                <p className="text-emerald-500 font-black text-xs uppercase tracking-[0.3em] animate-pulse mb-10">Real-time sync active</p>
                <div className="w-full space-y-4">
                  <div className="flex justify-between items-center py-4 border-b border-slate-50">
                     <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Main Cluster</span>
                     <span className="text-primary font-black text-sm">99.99% Up</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-slate-50">
                     <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Database Sync</span>
                     <span className="text-primary font-black text-sm">Verified</span>
                  </div>
                  <div className="flex justify-between items-center py-4">
                     <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Security Layer</span>
                     <span className="text-emerald-500 font-black text-sm">Hyper-Secure</span>
                  </div>
                </div>
              </div>
              
              <div className="dashboard-card p-12 rounded-[3rem] border-slate-100">
                <h3 className="text-primary font-black text-xl tracking-tight mb-10">Diagnostic Event Log</h3>
                <div className="space-y-8">
                  <AdminActivityItem icon={<Activity className="w-4 h-4" />} iconColor="bg-slate-50 text-primary" title="Automated Scalability Check" desc="System confirmed handling 4.2k requests/sec" time="2 mins ago" />
                  <AdminActivityItem icon={<XCircle className="w-4 h-4" />} iconColor="bg-rose-50 text-rose-500" title="Unauthorized Entry Prevented" desc="Brute force mitigation active on Admin Portal" time="15 mins ago" />
                  <AdminActivityItem icon={<Globe className="w-4 h-4" />} iconColor="bg-slate-50 text-primary" title="Global CDN Propagation" desc="Edge nodes refreshed across all regions" time="1 hour ago" />
                  <AdminActivityItem icon={<Server className="w-4 h-4" />} iconColor="bg-slate-50 text-primary" title="Snapshot Backup Locked" desc="Automated recovery point generated successfully" time="3 hours ago" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== PLACEHOLDER VIEWS ===== */}
        {['users', 'logs', 'settings'].includes(activeTab) && (
          <div className="dashboard-card p-32 text-center rounded-[3rem] border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
               {activeTab === 'users' ? <UserCog className="w-10 h-10 text-slate-200" /> : <Settings className="w-10 h-10 text-slate-200" />}
            </div>
            <h3 className="text-primary font-black text-2xl tracking-tight mb-2 uppercase">{activeTab} MODULE</h3>
            <p className="text-slate-400 font-medium">Secure access restricted. Resource pending synchronization.</p>
          </div>
        )}

        {/* ===== ADMIN PROFILE ===== */}
        {activeTab === 'profile' && (
          <div className="space-y-8">
            <h2 className="text-primary font-black text-2xl tracking-tight">Governance Identity</h2>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Profile Card */}
              <div className="lg:col-span-4">
                <div className="dashboard-card p-12 text-center rounded-[3rem] border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                  <div className="w-32 h-32 rounded-[2.5rem] bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/5 group-hover:scale-105 transition-transform">
                    <span className="text-5xl font-black text-primary uppercase">{user.name?.charAt(0)}</span>
                  </div>
                  <h3 className="text-primary text-2xl font-black tracking-tight">{user.name}</h3>
                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3 mb-10">Authorized SuperAdmin</p>
                  
                  <div className="space-y-4 pt-8 border-t border-slate-50 text-left">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-bold">Clearance</span>
                      <span className="text-primary font-black underline decoration-emerald-500 decoration-4 underline-offset-4">Level-1</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-bold">Protocol ID</span>
                      <span className="text-primary font-mono font-black text-xs">#{user.id?.slice(-8).toUpperCase() || 'ROOT'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Data Grid */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="dashboard-card p-10 rounded-[2.5rem] border-slate-100">
                  <h3 className="text-primary font-black text-xs uppercase tracking-widest mb-8">Governance Reach</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold text-sm">Managed Nodes</span>
                      <span className="text-primary font-black text-xl">1,240</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold text-sm">Entity Clusters</span>
                      <span className="text-primary font-black text-xl">{clubs.length}</span>
                    </div>
                    <div className="pt-4">
                       <button className="w-full py-4 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-800 shadow-xl shadow-primary/20 transition-all">View Audit History</button>
                    </div>
                  </div>
                </div>

                <div className="dashboard-card p-10 rounded-[2.5rem] border-slate-100 flex flex-col justify-between">
                   <div>
                      <h3 className="text-primary font-black text-xs uppercase tracking-widest mb-6">Security Context</h3>
                      <div className="flex items-center gap-3 text-emerald-500 font-black text-xs uppercase tracking-widest mb-6">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        Network Encrypted
                      </div>
                   </div>
                   <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5 leading-none">Access Metadata</p>
                      <p className="text-primary font-black text-[10px] font-mono leading-tight">IP: 192.168.1.1 — Port: 443<br/>Sync: {new Date().toLocaleTimeString()}</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </motion.div>
    </DashboardLayout>
  );
};

/* ──── Sub Components ──── */

const HealthRow = ({ icon, label, status, statusColor }: any) => {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-rose-50 text-rose-500 border-rose-100',
  };
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary group-hover:bg-primary/5 transition-colors">
           {icon}
        </div>
        <span className="text-primary text-xs font-black uppercase tracking-widest">{label}</span>
      </div>
      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${colors[statusColor]}`}>{status}</span>
    </div>
  );
};

const AdminActivityItem = ({ icon, iconColor, title, desc, time }: any) => (
  <div className="flex items-start gap-5 group">
    <div className={`w-12 h-12 rounded-2xl ${iconColor} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-95 transition-transform`}>
       {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-primary text-sm font-black leading-tight tracking-tight">{title}</p>
      {desc && <p className="text-slate-400 text-xs mt-1 font-medium leading-relaxed">{desc}</p>}
      <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.15em] mt-2">{time}</p>
    </div>
  </div>
);

export default AdminDashboard;
