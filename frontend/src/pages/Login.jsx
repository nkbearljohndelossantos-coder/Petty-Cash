import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Eye, EyeOff, Loader2, ShieldCheck, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Access Denied. Please verify your corporate credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden px-4">
      {/* Subtle Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-erp-blue/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px]"></div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[340px] relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="flex items-center justify-center mx-auto mb-4 w-full"
          >
            <img src={logo} alt="NKB Petty Cash Logo" className="h-36 w-auto object-contain" />
          </motion.div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter mb-1.5">Enterprise Access</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[8px]">Petty Cash Management Intelligence</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="p-5 bg-rose-50 text-rose-600 text-xs font-black uppercase tracking-widest rounded-2xl border border-rose-100 text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Authorized ID</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-erp-blue transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  className="w-full pl-14 pr-6 py-3.5 bg-white border border-slate-200 rounded-[1rem] outline-none focus:ring-4 focus:ring-erp-blue/10 focus:border-erp-blue/50 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                  placeholder="Employee Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Security Credential</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-erp-blue transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="w-full pl-14 pr-14 py-3.5 bg-white border border-slate-200 rounded-[1rem] outline-none focus:ring-4 focus:ring-erp-blue/10 focus:border-erp-blue/50 transition-all font-black text-slate-900 placeholder:text-slate-300 tracking-[0.3em]"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-400 hover:text-slate-900 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-[1rem] text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 size={22} className="animate-spin" /> : (
                <>
                  <ShieldCheck size={20} />
                  <span>Authenticate Access</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col items-center gap-4">
             <div className="flex items-center gap-5">
                <div className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                   <Globe size={12} />
                   <span className="text-[9px] font-bold uppercase tracking-widest">Global Portal</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                   <ShieldCheck size={12} />
                   <span className="text-[9px] font-bold uppercase tracking-widest">Compliance</span>
                </div>
             </div>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] text-center leading-relaxed">
              Proprietary System of NKB Manufacturing. <br/> 
              Unauthorized entry is strictly prohibited and legally monitored.
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Bottom Footer Info */}
      <div className="absolute bottom-10 left-0 right-0 text-center opacity-30">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">NKB Manufacturing © 2026</p>
      </div>
    </div>
  );
};

export default Login;
