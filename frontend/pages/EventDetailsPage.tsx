import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, CheckCircle2, CalendarDays, MapPin, UserCheck } from 'lucide-react';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock Data based on the Stitch Design
  const event = {
    id,
    title: 'Quantum Computing Seminar',
    category: 'ACADEMIC SEMINAR',
    description: 'Explore the frontiers of quantum mechanics and its application in modern computing architectures. Join world-renowned experts for a deep dive into the next era of technology.',
    date: 'October 24, 2023',
    time: '10:00 AM - 01:00 PM',
    location: {
      name: 'Science Auditorium Hall B',
      address: 'University Campus, West Wing'
    },
    rules: [
      'Valid college ID required for entry',
      'No outside food or drinks allowed',
      'Registration must be completed 24 hours prior to the event'
    ],
    prizes: [
      { rank: 1, title: '1st Prize', sub: 'Certificate of Excellence', amount: '₹5,000', color: 'bg-emerald-500' },
      { rank: 2, title: '2nd Prize', sub: 'Merit Certificate', amount: '₹3,000', color: 'bg-slate-700' },
      { rank: 3, title: '3rd Prize', sub: 'Merit Certificate', amount: '₹1,500', color: 'bg-slate-800' }
    ],
    speakers: [
      { name: 'Dr. Sarah Jenkins', title: 'Lead Researcher at QuantumLab', desc: 'Over 15 years of experience in superconducting qubits and topological matter research.', img: 'https://i.pravatar.cc/150?u=sarah' },
      { name: 'Prof. Michael Chen', title: 'Head of Dept. Applied Physics', desc: 'Author of "The Quantum Century" and pioneer in error correction algorithms for noisy processors.', img: 'https://i.pravatar.cc/150?u=michael' }
    ]
  };

  return (
    <div className="min-h-screen bg-[#080b14] text-slate-200 pb-24 md:pb-0 font-sans">
      {/* Mobile Top Nav */}
      <div className="sticky top-0 z-50 bg-[#080b14]/90 backdrop-blur-xl border-b border-white/[0.04] px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/[0.06] rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-lg font-bold text-white">Event Details</h1>
        <button className="p-2 hover:bg-white/[0.06] rounded-full transition-colors">
          <Share2 className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Hero Image */}
        <div className="w-full h-64 md:h-80 relative overflow-hidden bg-gradient-to-br from-teal-900/40 to-indigo-900/40 border-b border-white/[0.06]">
          {/* Mock abstract wave pattern as in design */}
          <div className="absolute inset-0 opacity-40 mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle at 50% 100%, rgba(45, 212, 191, 0.5), transparent 70%)' }}></div>
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#080b14] to-transparent z-10" />
        </div>

        {/* Content Container */}
        <div className="px-5 md:px-8 py-6 -mt-8 relative z-20 space-y-8">
          
          {/* Header Info */}
          <div>
            <span className="inline-block px-3 py-1 bg-indigo-600/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-md mb-4 border border-indigo-500/20">
              {event.category}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">{event.title}</h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">{event.description}</p>
          </div>

          {/* Rules & Guidelines Container */}
          <div className="dashboard-card p-5 md:p-6 space-y-4">
            <h3 className="text-white font-bold flex items-center gap-2 mb-4">
              <span className="text-indigo-400">⚖️</span> Rules & Guidelines
            </h3>
            <ul className="space-y-3">
              {event.rules.map((rule, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                  <span className="leading-snug">{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prizes & Rewards */}
          <div className="dashboard-card p-5 md:p-6">
            <h3 className="text-white font-bold flex items-center gap-2 mb-5">
              <span className="text-emerald-400">🏆</span> Prizes & Rewards
            </h3>
            <div className="space-y-3 relative">
              {event.prizes.map((prize, idx) => (
                <div key={idx} className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3 md:p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-lg ${prize.color}`}>
                      {prize.rank}
                    </div>
                    <div>
                      <p className={`font-bold text-sm md:text-base ${idx === 0 ? 'text-emerald-400' : 'text-white'}`}>{prize.title}</p>
                      <p className="text-slate-500 text-xs md:text-sm">{prize.sub}</p>
                    </div>
                  </div>
                  <span className="text-white font-bold md:text-lg">{prize.amount}</span>
                </div>
              ))}
              <div className="pt-4 mt-2 border-t border-white/[0.04] flex gap-3 text-xs text-slate-500">
                <span className="text-slate-600">🏅</span> Participation certificates for all registered attendees.
              </div>
            </div>
          </div>

          {/* Logistics (Date & Location Blocks) */}
          <div className="space-y-3">
            <div className="dashboard-card p-4 md:p-5 flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                <CalendarDays className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm md:text-base">{event.date}</p>
                <p className="text-slate-500 text-xs md:text-sm mt-0.5">{event.time}</p>
              </div>
            </div>

            <div className="dashboard-card p-4 md:p-5 flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                <MapPin className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm md:text-base">{event.location.name}</p>
                <p className="text-slate-500 text-xs md:text-sm mt-0.5">{event.location.address}</p>
              </div>
            </div>
          </div>

          {/* Keynote Speakers */}
          <div>
            <h3 className="text-xl font-bold text-white mb-5">Keynote Speakers</h3>
            <div className="space-y-6">
              {event.speakers.map((speaker, idx) => (
                <div key={idx} className="flex gap-4">
                  <img src={speaker.img} alt={speaker.name} className="w-14 h-14 md:w-16 md:h-16 rounded-full border border-white/10 shrink-0 object-cover" />
                  <div>
                    <h4 className="text-white font-bold">{speaker.name}</h4>
                    <p className="text-indigo-400 text-xs md:text-sm font-medium mb-1.5">{speaker.title}</p>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">{speaker.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location Map visual */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Location</h3>
            <div className="w-full h-48 rounded-2xl bg-white/[0.02] border border-white/[0.04] relative overflow-hidden flex items-center justify-center text-slate-500">
              {/* Mock map image look */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/black-scales.png")' }}></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
                <MapPin className="w-8 h-8 text-indigo-500 mx-auto mb-2 drop-shadow-lg" />
                <span className="bg-[#0c1021] px-3 py-1 rounded-md text-xs font-bold text-white border border-white/10">Hall B, Science Wing</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Sticky Bottom Action Bar (Mobile & Desktop) */}
      <div className="fixed bottom-0 left-0 w-full p-4 md:p-6 bg-[#080b14]/90 backdrop-blur-xl border-t border-white/[0.06] z-50 flex justify-center">
        <button className="w-full max-w-sm bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 text-sm md:text-base">
          <UserCheck className="w-5 h-5" /> Register Now
        </button>
      </div>
    </div>
  );
};

export default EventDetailsPage;
