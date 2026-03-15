import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Building2, UserCog, ShieldCheck, Mail, Lock, ArrowRight, Hash, Upload, FileText, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

const AuthPage = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [coordinator, setCoordinator] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getPortalDetails = () => {
    switch(type) {
      case 'student': return { title: 'Student Portal', icon: GraduationCap, color: 'text-indigo-400', glow: 'bg-indigo-600' };
      case 'club': return { title: 'Club Portal', icon: Building2, color: 'text-violet-400', glow: 'bg-violet-600' };
      case 'hod': return { title: 'HOD Portal', icon: UserCog, color: 'text-amber-400', glow: 'bg-amber-600' };
      case 'admin': return { title: 'Admin Portal', icon: ShieldCheck, color: 'text-emerald-400', glow: 'bg-emerald-600' };
      default: return { title: 'Portal', icon: Lock, color: 'text-slate-400', glow: 'bg-slate-600' };
    }
  };

  const { title, icon: Icon } = getPortalDetails();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (type === 'student') {
        if (isLogin) {
          const res = await api.post('/students/login', { email, password });
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          toast.success(`Welcome back, ${res.data.user.name}!`);
          navigate('/student/dashboard');
        } else {
          const res = await api.post('/students/register', { name, email, password, department, rollNumber });
          toast.success(res.data.message);
          setIsLogin(true);
        }
      } else if (type === 'club') {
        if (isLogin) {
          const res = await api.post('/clubs/login', { email, password });
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          toast.success(`Welcome back, ${res.data.user.name}!`);
          navigate('/club/dashboard');
        } else {
          const formData = new FormData();
          formData.append('name', name);
          formData.append('email', email);
          formData.append('password', password);
          formData.append('department', department);
          formData.append('coordinator', coordinator);
          if (proofFile) formData.append('proofFile', proofFile);
          const res = await api.post('/clubs/register', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          toast.success(res.data.message);
          setIsLogin(true);
        }
      } else if (type === 'hod') {
        if (isLogin) {
          const res = await api.post('/hod/login', { email, password });
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          toast.success(`Welcome to the ${title}, ${res.data.user.name}!`);
          navigate('/hod/dashboard');
        } else {
          const res = await api.post('/hod/register', { name, email, password, department });
          toast.success(res.data.message);
          setIsLogin(true);
        }
      } else if (type === 'admin') {
        if (isLogin) {
          const res = await api.post('/admin/login', { email, password });
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          toast.success(`Welcome, ${res.data.user.name}! 👋`);
          navigate('/admin/dashboard');
        } else {
          toast.error('Admin accounts cannot self-register. Contact system administrator.');
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success(`Welcome to the ${title}!`);
        navigate(`/${type}/dashboard`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-20 bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 p-10 md:p-14 relative overflow-hidden"
      >
        <div className="flex flex-col items-center mb-12 relative z-10">
          <div className="bg-primary/5 p-5 rounded-3xl mb-6 border border-primary/10">
            <Icon className={`w-10 h-10 text-primary`} />
          </div>
          <h2 className="text-4xl font-extrabold text-primary mb-3">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h2>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 self-center">
            <span className="text-secondary font-bold text-xs uppercase tracking-wider">{title}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden">
                <div>
                  <label className="form-label">{type === 'club' ? 'Club Name' : 'Full Name'}</label>
                  <div className="relative">
                    <input type="text" className="input-field pl-14" placeholder={type === 'club' ? 'e.g., CodingX' : 'John Doe'} value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} />
                    <UserCog className="w-6 h-6 text-slate-400 absolute left-5 top-4" />
                  </div>
                </div>
                {type === 'student' && (
                  <div>
                    <label className="form-label">Roll Number</label>
                    <div className="relative">
                      <input type="text" className="input-field pl-14" placeholder="211620104___" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} required={!isLogin && type === 'student'} />
                      <Hash className="w-6 h-6 text-slate-400 absolute left-5 top-4" />
                    </div>
                  </div>
                )}
                {type === 'club' && (
                  <div>
                    <label className="form-label">Coordinator Name</label>
                    <div className="relative">
                      <input type="text" className="input-field pl-14" placeholder="Prof. Smith" value={coordinator} onChange={(e) => setCoordinator(e.target.value)} required={!isLogin && type === 'club'} />
                      <UserCog className="w-6 h-6 text-slate-400 absolute left-5 top-4" />
                    </div>
                  </div>
                )}
                {type === 'club' && (
                  <div>
                    <label className="form-label text-slate-700">Submit Proof Document</label>
                    <label className={`flex flex-col items-center gap-2 w-full border-2 border-dashed rounded-[1.5rem] px-6 py-6 cursor-pointer transition-all ${proofFile ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50 hover:border-primary/50 hover:bg-white'}`}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file && file.size > 5 * 1024 * 1024) {
                            toast.error('File too large. Max size is 5MB.');
                            return;
                          }
                          setProofFile(file);
                        }}
                      />
                      {proofFile ? (
                        <div className="flex items-center gap-4 text-primary">
                          <FileText className="w-8 h-8 shrink-0" />
                          <div className="text-left">
                            <p className="text-sm font-bold truncate max-w-[200px]">{proofFile.name}</p>
                            <p className="text-xs text-slate-500">{(proofFile.size / 1024).toFixed(1)} KB — Tap to change</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Upload className="w-8 h-8 text-primary/40" />
                          <p className="text-sm font-bold text-slate-600">Click to upload proof</p>
                          <p className="text-xs text-center">Faculty letter, approval letter, or registration docs</p>
                        </div>
                      )}
                    </label>
                  </div>
                )}
                {(type === 'student' || type === 'club' || type === 'hod') && (
                  <div>
                    <label className="form-label">Department / Domain</label>
                    <div className="relative">
                      <select className="input-field pl-14 appearance-none" value={department} onChange={(e) => setDepartment(e.target.value)} required={!isLogin}>
                        <option value="" disabled className="bg-white">Select Department</option>
                        {['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML'].map(d => (
                          <option key={d} value={d} className="bg-white">{d}</option>
                        ))}
                        {type === 'club' && <option value="General" className="bg-white">General (All branches)</option>}
                      </select>
                      <Building2 className="w-6 h-6 text-slate-400 absolute left-5 top-4" />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="form-label">Email Address</label>
            <div className="relative">
              <input type="email" className="input-field pl-14" placeholder="user@rajalakshmi.edu.in" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Mail className="w-6 h-6 text-slate-400 absolute left-5 top-4" />
            </div>
          </div>

          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className="input-field pl-14 pr-14" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <Lock className="w-6 h-6 text-slate-400 absolute left-5 top-4" />
              <button
                type="button"
                className="absolute right-5 top-4 text-slate-400 hover:text-primary transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-4 rounded-2xl flex text-lg justify-center items-center gap-3 mt-4 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-70" disabled={isLoading}>
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>{isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        {(type === 'student' || type === 'club') && (
          <div className="mt-10 text-center relative z-10">
            <p className="text-slate-500 font-medium">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button type="button" onClick={() => setIsLogin(!isLogin)} className={`ml-2 font-bold text-secondary hover:underline`}>
                {isLogin ? 'Register now' : 'Sign in here'}
              </button>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AuthPage;
