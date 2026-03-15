import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Search, Filter, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

const categoryColors: Record<string, string> = {
  'AI & ML': 'bg-indigo-600',
  'AI & DS': 'bg-blue-600',
  'Web Development': 'bg-emerald-600',
  'Cybersecurity': 'bg-rose-600',
  'Robotics': 'bg-amber-600',
  'Cultural': 'bg-pink-600',
  'Sports': 'bg-emerald-600',
  'General': 'bg-slate-600',
};

const EventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      // Only show approved events for the public
      const approved = res.data.filter((e: any) => e.status === 'Approved');
      setEvents(approved);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const domains = ['All', ...new Set(events.map(e => e.domain))];

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         e.club?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain = selectedDomain === 'All' || e.domain === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24">
      <div className="container mx-auto px-6 md:px-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-primary/10"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live Ecosystem
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black text-primary tracking-tight"
            >
              Explore <span className="text-secondary italic">Opportunities</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 text-lg font-medium mt-6 leading-relaxed"
            >
              Discover every department event, hackathon, and workshop happening across the campus.
            </motion.p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search cluster..."
                className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-primary focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Domain Filter Bar */}
        <div className="flex gap-3 overflow-x-auto pb-8 scrollbar-none">
          {domains.map((domain: any) => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                selectedDomain === domain
                  ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20'
                  : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
              }`}
            >
              {domain} {domain === 'All' ? 'Events' : 'Sector'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-6">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">Synchronizing Data...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-24 text-center border border-slate-100 shadow-sm">
             <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                <Filter className="w-10 h-10 text-slate-200" />
             </div>
             <h3 className="text-primary font-black text-2xl tracking-tight mb-2">No Clusters Found</h3>
             <p className="text-slate-500 font-medium">Try adjusting your search or category filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, idx) => (
              <motion.div
                key={event._id || event.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/events/${event._id || event.id}`)}
                className="bg-white rounded-[2.5rem] border border-slate-100 flex flex-col overflow-hidden group hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all cursor-pointer shadow-sm"
              >
                {/* Image Placeholder with Gradient Overlay */}
                <div className={`h-32 ${categoryColors[event.domain] || 'bg-slate-600'} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute top-6 right-6 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-[10px] text-white font-black uppercase tracking-widest">
                    {event.domain}
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-1 -mt-10">
                  <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-black/5 mb-8 group-hover:-translate-y-2 transition-transform duration-500">
                    <h3 className="text-primary font-black text-xl leading-tight line-clamp-2 tracking-tight">{event.title}</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500" />
                       {event.club?.name || 'Authorized Hub'}
                    </p>
                  </div>

                  <div className="space-y-4 mb-10">
                    <div className="flex items-center gap-4 text-slate-500 font-bold text-sm">
                       <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all">
                          <CalendarDays className="w-5 h-5" />
                       </div>
                       {event.date}
                    </div>
                    <div className="flex items-center gap-4 text-slate-500 font-bold text-sm">
                       <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all">
                          <MapPin className="w-5 h-5" />
                       </div>
                       <span className="truncate">{event.location}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Fee</p>
                        <p className="text-lg font-black text-primary leading-none">
                          {event.regFee === 0 ? 'FREE' : `₹${event.regFee}`}
                        </p>
                     </div>
                     <button className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all border border-slate-100 group-hover:bg-primary group-hover:text-white">
                        <ArrowRight className="w-6 h-6" />
                     </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
