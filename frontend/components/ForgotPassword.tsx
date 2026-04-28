import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Key, CheckCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

const steps = { EMAIL: "email", OTP: "otp", RESET: "reset", SUCCESS: "success" };

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [step, setStep] = useState(steps.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const startResendTimer = () => {
    setResendTimer(60);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      toast.success(res.data.message || "OTP sent to your email!");
      setStep(steps.OTP);
      startResendTimer();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) {
      const nextInput = document.getElementById(`otp-${idx + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      const prevInput = document.getElementById(`otp-${idx - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { email, otp: code });
      toast.success(res.data.message || "OTP verified!");
      setStep(steps.RESET);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

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
        email, 
        otp: otp.join(""), 
        newPassword: password 
      });
      toast.success(res.data.message || "Password reset successful!");
      setStep(steps.SUCCESS);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("New OTP sent!");
      startResendTimer();
    } catch (err: any) {
      toast.error("Failed to resend OTP.");
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
    <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 p-10 md:p-14 relative overflow-hidden">
      <div className="flex flex-col items-center mb-12 relative z-10">
        <div className="bg-primary/5 dark:bg-white/5 p-5 rounded-3xl mb-6 border border-primary/10 dark:border-white/10 text-primary dark:text-white">
          🎓 <span className="font-bold">Smart Campus</span>
        </div>
        
        <AnimatePresence mode="wait">
          {step === steps.EMAIL && (
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
                <p className="text-slate-500">Enter your registered email and we'll send a verification code.</p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-6">
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
                  {loading ? "Sending..." : "Send Verification Code"}
                </button>
              </form>
              <button 
                className="mt-8 flex items-center justify-center gap-2 text-slate-500 font-bold hover:text-primary transition-colors w-full" 
                onClick={onBack}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            </motion.div>
          )}

          {step === steps.OTP && (
            <motion.div 
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <div className="text-center mb-8">
                <div className="bg-amber-50 dark:bg-amber-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-3xl font-extrabold text-primary dark:text-white mb-2">Check Your Email</h2>
                <p className="text-slate-500">We sent a 6-digit code to <strong className="text-slate-700 dark:text-slate-200">{email}</strong></p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-8">
                <div className="flex gap-2 sm:gap-4 justify-center">
                  {otp.map((d, i) => (
                    <input 
                      key={i} 
                      id={`otp-${i}`} 
                      className="w-12 h-16 sm:w-14 sm:h-20 text-center text-2xl font-bold border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all dark:bg-slate-800 dark:text-white"
                      type="text" 
                      inputMode="numeric" 
                      maxLength={1}
                      value={d} 
                      onChange={e => handleOtpChange(e.target.value, i)}
                      onKeyDown={e => handleOtpKeyDown(e, i)} 
                    />
                  ))}
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-4 rounded-2xl flex text-lg justify-center items-center gap-3 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-70"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
              </form>
              
              <div className="mt-8 flex flex-col items-center gap-2">
                <span className="text-slate-500 font-medium">Didn't receive it?</span>
                <button 
                  className={`flex items-center gap-2 font-bold text-secondary transition-all ${resendTimer > 0 ? 'opacity-40 cursor-not-allowed' : 'hover:underline'}`}
                  onClick={handleResend} 
                  disabled={resendTimer > 0}
                >
                  <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                </button>
              </div>
            </motion.div>
          )}

          {step === steps.RESET && (
            <motion.div 
              key="reset"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <div className="text-center mb-8">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-3xl font-extrabold text-primary dark:text-white mb-2">Set New Password</h2>
                <p className="text-slate-500">Choose a strong password for your account.</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="form-label">New Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      className="input-field pl-14" 
                      placeholder="Min. 8 characters"
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                    />
                    <Lock className="w-6 h-6 text-slate-400 absolute left-5 top-4" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      className="input-field pl-14" 
                      placeholder="Re-enter password"
                      value={confirm} 
                      onChange={e => setConfirm(e.target.value)} 
                      required 
                    />
                    <Lock className="w-6 h-6 text-slate-400 absolute left-5 top-4" />
                  </div>
                </div>

                <div className="flex gap-1.5 pt-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${password.length >= i * 3 ? getStrengthColor(password.length) : 'bg-slate-100 dark:bg-slate-800'}`}
                    />
                  ))}
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-4 rounded-2xl flex text-lg justify-center items-center gap-3 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-70"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Reset Password"}
                </button>
              </form>
            </motion.div>
          )}

          {step === steps.SUCCESS && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full text-center"
            >
              <div className="bg-green-50 dark:bg-green-900/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="w-14 h-14 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-3xl font-extrabold text-primary dark:text-white mb-4">Password Reset!</h2>
              <p className="text-slate-500 mb-10 leading-relaxed">Your password has been updated successfully. You can now log in with your new credentials.</p>
              <button 
                className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-4 rounded-2xl flex text-lg justify-center items-center gap-3 transition-all shadow-xl shadow-primary/20 active:scale-95" 
                onClick={onBack}
              >
                Go to Login <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center gap-3 mt-12">
          {[steps.EMAIL, steps.OTP, steps.RESET, steps.SUCCESS].map((s) => {
            const stepOrder = [steps.EMAIL, steps.OTP, steps.RESET, steps.SUCCESS];
            const currentIdx = stepOrder.indexOf(step);
            const thisIdx = stepOrder.indexOf(s);
            
            return (
              <div 
                key={s} 
                className={`h-2 rounded-full transition-all duration-500 ${s === step ? 'w-8 bg-primary' : thisIdx < currentIdx ? 'w-2 bg-primary/40' : 'w-2 bg-slate-200 dark:bg-slate-800'}`} 
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
