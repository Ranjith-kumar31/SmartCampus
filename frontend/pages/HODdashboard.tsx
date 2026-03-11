import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, FileCheck, BarChart2, FileText, Settings, TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layouts/DashboardLayout';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

const navItems = [
  { icon: FileCheck, label: 'OD Requests', id: 'requests' },
  { icon: BarChart2, label: 'Department Analytics', id: 'analytics' },
  { icon: FileText, label: 'Reports', id: 'reports' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

const HODdashboard = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [odRequests, setOdRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingODs = async () => {
    setLoading(true);
    try { const res = await api.get('/od/pending'); setOdRequests(res.data); }
    catch { toast.error('Failed to load OD requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPendingODs(); }, []);

  const handleAction = async (id: string, status: string) => {
    try {
      await api.patch(`/od/${id}/status`, { status, remarks: `${status} by HOD` });
      toast.success(`OD Request ${status}!`);
      fetchPendingODs();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const filteredRequests = odRequests.filter((req: any) =>
    (req.student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (req.student?.rollNumber || '').includes(searchTerm) ||
    (req.event?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const approvedCount = odRequests.filter((r: any) => r.status === 'Approved').length;
  const rejectedCount = odRequests.filter((r: any) => r.status === 'Rejected').length;
  const pendingCount = odRequests.filter((r: any) => r.status === 'Pending').length;
  const totalCount = odRequests.length;
  const approvalRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  const OD_STATS = [
    { name: 'Approved', value: approvedCount || 1, color: '#6366f1', pct: totalCount > 0 ? Math.round((approvedCount/totalCount)*100) : 80 },
    { name: 'Pending', value: pendingCount || 1, color: '#f59e0b', pct: totalCount > 0 ? Math.round((pendingCount/totalCount)*100) : 12 },
    { name: 'Rejected', value: rejectedCount || 1, color: '#ef4444', pct: totalCount > 0 ? Math.round((rejectedCount/totalCount)*100) : 8 },
  ];

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { name: 'HOD', department: 'Unknown', id: '' };

  return (
    <DashboardLayout
      title={`HOD Portal - ${user.department} Department`}
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

        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <HodStatCard title="Total ODs Processed" value={totalCount > 0 ? String(totalCount) : '1,284'} trend="+12%" trendUp icon={<CheckCircle className="w-5 h-5" />} accent="emerald" />
              <HodStatCard title="Approval Rate" value={`${approvalRate || 88}%`} trend="+2%" trendUp icon={<TrendingUp className="w-5 h-5" />} accent="indigo" />
              <HodStatCard title="Pending Review" value={String(pendingCount || 24)} trend="-5%" icon={<Clock className="w-5 h-5" />} accent="amber" />
            </div>

            {/* Pending OD Requests + Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Table */}
              <div className="lg:col-span-2 dashboard-card overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <h3 className="text-white font-bold">Pending OD Requests</h3>
                  <button className="text-indigo-400 text-sm font-medium hover:text-indigo-300">View All</button>
                </div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Student Name</th>
                      <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Event</th>
                      <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Status</th>
                      <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {loading ? (
                      <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
                    ) : filteredRequests.length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No pending OD requests.</td></tr>
                    ) : (
                      filteredRequests.map((req: any) => (
                        <tr key={req._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="text-white font-medium">{req.student?.name || 'Unknown'}</p>
                            <p className="text-slate-500 text-xs">{req.student?.rollNumber || 'N/A'}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-slate-300 text-sm">{req.event?.title || 'N/A'}</p>
                            <p className="text-slate-500 text-xs">{req.reason?.slice(0, 30)}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Pending
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex gap-2">
                              <button onClick={() => handleAction(req._id, 'Approved')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleAction(req._id, 'Rejected')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Status Overview Donut */}
              <div className="dashboard-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold">Status Overview</h3>
                  <button className="text-slate-500 hover:text-white"><MoreHorizontal className="w-5 h-5" /></button>
                </div>
                <div className="h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={OD_STATS} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                        {OD_STATS.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-white">{totalCount > 0 ? totalCount.toLocaleString() : '1,284'}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Total ODs</span>
                  </div>
                </div>
                <div className="space-y-2.5 mt-2">
                  {OD_STATS.map((stat) => (
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

            {/* Recent Department Activity */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Recent Department Activity</h3>
                <div className="flex gap-2">
                  {['All Events', 'Technical', 'Sports'].map((tab, i) => (
                    <button key={tab} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${i === 0 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <ActivityCard icon="✅" iconBg="bg-emerald-500/10" title="Bulk OD Approval" desc="45 students approved for 'Smart India Hackathon' participation." time="2 hours ago" />
                <ActivityCard icon="ℹ️" iconBg="bg-indigo-500/10" title="System Update" desc="New OD guidelines for 2024 semester have been published." time="5 hours ago" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="dashboard-card p-8 text-center text-slate-500">
            Department analytics coming soon.
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="dashboard-card p-8 text-center text-slate-500">
            Reports module coming soon.
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="dashboard-card p-8 text-center text-slate-500">
            Settings coming soon.
          </div>
        )}

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
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Office</p>
                    <p className="text-slate-200 text-sm">Main Block — Room 104</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <div className="dashboard-card p-6">
                  <h3 className="text-white font-bold mb-4">Department Snapshot</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      <p className="text-slate-500 text-xs mb-1">Students Enrolled</p>
                      <p className="text-2xl font-bold text-white">450+</p>
                    </div>
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      <p className="text-slate-500 text-xs mb-1">Pending ODs</p>
                      <p className="text-2xl font-bold text-amber-400">{odRequests.length}</p>
                    </div>
                  </div>
                </div>

                <div className="dashboard-card p-6">
                  <h3 className="text-white font-bold mb-4">Administrator Privileges</h3>
                  <ul className="space-y-3">
                    {['Approve/Reject Student On-Duty requests', 'Review department event proposals', 'Access student participation analytics', 'Generate academic event reports'].map((item, i) => (
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
    </DashboardLayout>
  );
};

/* ──── Sub Components ──── */

const HodStatCard = ({ title, value, trend, trendUp, icon, accent }: any) => {
  const accents: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    indigo: 'bg-indigo-500/10 text-indigo-400',
    amber: 'bg-amber-500/10 text-amber-400',
  };
  return (
    <div className="dashboard-card p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-slate-500 text-xs font-medium">{title}</p>
        <div className={`p-2 rounded-lg ${accents[accent]}`}>{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-white text-3xl font-bold">{value}</p>
        {trend && (
          <span className={`text-xs font-bold ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>{trend}</span>
        )}
      </div>
    </div>
  );
};

const ActivityCard = ({ icon, iconBg, title, desc, time }: any) => (
  <div className="dashboard-card p-4 flex items-start gap-4">
    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-lg flex-shrink-0`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-white font-medium text-sm">{title}</p>
      <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
    </div>
    <span className="text-slate-600 text-xs whitespace-nowrap">{time}</span>
  </div>
);

export default HODdashboard;
