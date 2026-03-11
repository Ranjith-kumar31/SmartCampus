import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Send, Bot, User, Calendar,
  MapPin, Loader2, Sparkles, ChevronDown, RotateCcw
} from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

interface EventCard {
  id: string;
  title: string;
  domain: string;
  date: string;
  time: string;
  location: string;
  regFee: number;
  clubName: string;
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  type: 'text' | 'events';
  content: string;
  events?: EventCard[];
  timestamp: Date;
  isTyping?: boolean;
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'bot',
  type: 'text',
  content: "👋 Hi! I'm **CampusBot**, your Smart Campus AI assistant!\n\nI can help you:\n- 🎉 Find events & workshops\n- 📖 Answer general knowledge questions\n- 🗓️ Get campus & OD info\n- 💡 Recommend upcoming events\n\nWhat would you like to know today?",
  timestamp: new Date(),
};

const QUICK_PROMPTS = [
  { label: '🎉 Upcoming events', msg: 'Show me upcoming events' },
  { label: '💻 Coding contests', msg: 'Find coding competitions' },
  { label: '🤖 AI workshops', msg: 'Any AI or ML workshops?' },
  { label: '📋 OD requests', msg: 'How do OD requests work?' },
  { label: '🧠 What is ML?', msg: 'What is machine learning?' },
];

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
}

function EventCardComponent({ event }: { event: EventCard }) {
  const date = event.date
    ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'TBD';

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 space-y-1.5 hover:border-indigo-500/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-white text-sm font-semibold leading-snug">{event.title}</p>
        {event.domain && (
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full shrink-0 font-medium uppercase tracking-wide">
            {event.domain}
          </span>
        )}
      </div>
      <p className="text-slate-400 text-xs">{event.clubName}</p>
      <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 pt-0.5">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-indigo-400" />
          {date} {event.time && `• ${event.time}`}
        </span>
        {event.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-400" />
            {event.location}
          </span>
        )}
      </div>
      <div className="pt-1">
        {!event.regFee || event.regFee === 0 ? (
          <span className="text-[11px] text-emerald-400 font-semibold">✓ Free Registration</span>
        ) : (
          <span className="text-[11px] text-amber-400 font-semibold">₹{event.regFee} Registration</span>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isBot = msg.role === 'bot';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2.5 ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isBot ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20' : 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
        {isBot
          ? <Bot className="w-4 h-4 text-white" />
          : <User className="w-4 h-4 text-white" />}
      </div>

      <div className={`max-w-[85%] space-y-2 ${isBot ? '' : 'items-end flex flex-col'}`}>
        {/* Typing indicator */}
        {msg.isTyping ? (
          <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3">
            <div className="flex gap-1.5 items-center">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        ) : (
          <>
            {/* Text content */}
            {msg.content && (
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                isBot
                  ? 'bg-white/[0.06] border border-white/[0.08] text-slate-200 rounded-tl-sm'
                  : 'bg-indigo-600 text-white rounded-tr-sm shadow-lg shadow-indigo-600/20'
              }`}>
                <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
              </div>
            )}

            {/* Event cards */}
            {msg.type === 'events' && msg.events && msg.events.length > 0 && (
              <div className="space-y-2 w-full">
                {msg.events.map((ev) => (
                  <EventCardComponent key={ev.id} event={ev} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Timestamp */}
        {!msg.isTyping && (
          <p className={`text-[10px] text-slate-600 px-1 ${isBot ? '' : 'text-right'}`}>
            {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom(false);
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, scrollToBottom]);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open, scrollToBottom]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBtn(distFromBottom > 150);
  };

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // Try to get user data from localStorage for department context
    let department = null;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        department = user.department;
      }
    } catch {}

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      type: 'text',
      content: trimmed,
      timestamp: new Date(),
    };

    const typingMsg: Message = {
      id: `typing-${Date.now()}`,
      role: 'bot',
      type: 'text',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    };

    setMessages(prev => [...prev, userMsg, typingMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await axios.post(`${API_BASE}/api/chatbot/message`, { 
        message: trimmed,
        department: department
      }, { timeout: 20000 });

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        type: data.type || 'text',
        content: data.message || '',
        events: data.events,
        timestamp: new Date(),
      };

      setMessages(prev => prev.filter(m => !m.isTyping).concat(botMsg));
      if (!open) setUnread(u => u + 1);
    } catch {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'bot',
        type: 'text',
        content: "⚠️ Oops! Couldn't reach the server. Please make sure the backend is running and try again.",
        timestamp: new Date(),
      };
      setMessages(prev => prev.filter(m => !m.isTyping).concat(errMsg));
    } finally {
      setLoading(false);
    }
  }, [loading, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const resetChat = () => {
    setMessages([WELCOME]);
    setInput('');
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <div className="fixed bottom-6 right-6 z-[200]">
        <AnimatePresence>
          {!open && unread > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold z-10 shadow-lg"
            >
              {unread}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen(o => !o)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${
            open
              ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
              : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/40 hover:shadow-indigo-500/60'
          }`}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageCircle className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* pulse ring when closed */}
          {!open && (
            <span className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping" />
          )}
        </motion.button>
      </div>

      {/* ── Chat Window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-6 z-[199] w-[370px] max-w-[calc(100vw-1.5rem)] flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/[0.08]"
            style={{ height: '540px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight">CampusBot</p>
                <p className="text-indigo-200 text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Smart Campus AI Assistant
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={resetChat}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                  title="Reset chat"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto bg-[#080b14] px-3 py-4 space-y-4 scroll-smooth"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
            >
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => scrollToBottom()}
                  className="absolute bottom-[72px] left-1/2 -translate-x-1/2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-1.5 shadow-lg transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Quick prompts */}
            {messages.length <= 2 && (
              <div className="bg-[#080b14] border-t border-white/[0.04] px-3 py-2">
                <p className="text-slate-500 text-[10px] mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Quick questions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.label}
                      onClick={() => sendMessage(qp.msg)}
                      disabled={loading}
                      className="text-[11px] bg-white/[0.04] hover:bg-indigo-500/20 border border-white/[0.06] hover:border-indigo-500/30 text-slate-300 hover:text-white rounded-full px-2.5 py-1 transition-all disabled:opacity-50"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="bg-[#0c1021] border-t border-white/[0.06] px-3 py-3">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  placeholder="Ask me anything..."
                  maxLength={500}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg shadow-indigo-600/20 shrink-0"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                    : <Send className="w-4 h-4 text-white" />
                  }
                </button>
              </form>
              <p className="text-slate-600 text-[10px] text-center mt-1.5">
                Powered by Smart Campus AI · {input.length}/500
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
