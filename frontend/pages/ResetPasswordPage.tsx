import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Key, CheckCircle, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token.");
      navigate("/");
    }
  }, [token, navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", { 
        token, 
        newPassword: password 
      });
      toast.success(res.data.message || "Password reset successful!");
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (len: number) => {
    if (len < 5) return "bg-red-500";
    if (len < 8) return "bg-amber-500";
    if (len < 12) return "bg-emerald-500";
    return "bg-green-600";
  };

  return (
    <div className="min-h-screen bg-[#080b14] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white/5 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/10 p-10 md:p-14 relative overflow-hidden">
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="bg-indigo-500/20 p-5 rounded-3xl mb-6 border border-indigo-500/30 text-indigo-400">
            🎓 <span className="font-bold">Smart Campus</span>
          </div>

          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div 
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <div className="text-center mb-8">
                  <div className="bg-emerald-900/40 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                    <Key className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-white mb-2">Set New Password</h2>
                  <p className="text-slate-400">Choose a strong password for your account.</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" 
                        placeholder="Min. 8 characters"
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                      />
                      <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" 
                        placeholder="Re-enter password"
                        value={confirm} 
                        onChange={e => setConfirm(e.target.value)} 
                        required 
                      />
                      <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                    </div>
                  </div>

                  <div className="flex gap-1.5 pt-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${password.length >= i * 3 ? getStrengthColor(password.length) : 'bg-slate-800'}`}
                      />
                    ))}
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl flex text-lg justify-center items-center gap-3 transition-all shadow-lg active:scale-95 disabled:opacity-70"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Reset Password"}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full text-center"
              >
                <div className="bg-green-900/40 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/30">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-4">Password Reset!</h2>
                <p className="text-slate-400 mb-10 leading-relaxed">Your password has been updated successfully. You can now log in with your new credentials.</p>
                <button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl flex text-lg justify-center items-center gap-3 transition-all shadow-lg active:scale-95" 
                  onClick={() => navigate('/auth/login')}
                >
                  Go to Login <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
