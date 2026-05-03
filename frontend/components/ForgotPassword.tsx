import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Send } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      toast.success(res.data.message || "Reset link sent!");
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 p-10 md:p-14 relative overflow-hidden">
      <div className="flex flex-col items-center mb-12 relative z-10">
        <div className="bg-primary/5 dark:bg-white/5 p-5 rounded-3xl mb-6 border border-primary/10 dark:border-white/10 text-primary dark:text-white">
          🎓 <span className="font-bold">Smart Campus</span>
        </div>
        
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div 
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <div className="text-center mb-8">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-3xl font-extrabold text-primary dark:text-white mb-2">Forgot Password?</h2>
                <p className="text-slate-500">Enter your registered email to receive a password reset link.</p>
              </div>

              <form onSubmit={handleSendLink} className="space-y-6">
                <div>
                  <label className="form-label">Email Address</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      className="input-field pl-14" 
                      placeholder="you@rajalakshmi.edu.in"
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required 
                      autoFocus 
                    />
                    <Mail className="w-6 h-6 text-slate-400 absolute left-5 top-4" />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-4 rounded-2xl flex text-lg justify-center items-center gap-3 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-70"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
              <button 
                className="mt-8 flex items-center justify-center gap-2 text-slate-500 font-bold hover:text-primary transition-colors w-full" 
                onClick={onBack}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full text-center"
            >
              <div className="bg-indigo-50 dark:bg-indigo-900/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-indigo-500/20">
                <Send className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-3xl font-extrabold text-primary dark:text-white mb-4">Check your Email!</h2>
              <p className="text-slate-500 mb-10 leading-relaxed">
                If an account exists with <strong className="text-slate-700 dark:text-slate-200">{email}</strong>, we've sent a link to reset your password. The link will expire in 15 minutes.
              </p>
              <button 
                className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-4 rounded-2xl flex text-lg justify-center items-center gap-3 transition-all shadow-xl shadow-primary/20 active:scale-95" 
                onClick={onBack}
              >
                Return to Login
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
