import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Camera, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  Key
} from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setLoading(true);
    try {
      await api.put('/users/profile/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Configuration</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your professional profile and security parameters.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-8">
          <div className="erp-card bg-white p-8 text-center border border-slate-200 shadow-sm">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-erp-blue to-blue-400 flex items-center justify-center text-white text-5xl font-black shadow-lg">
                {user?.full_name?.[0]}
              </div>
              <button className="absolute bottom-0 right-0 p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl shadow-lg hover:scale-110 transition-transform">
                <Camera size={18} />
              </button>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{user?.full_name}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{user?.role}</p>
            
            <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 gap-3">
               <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-100">
                  <Briefcase size={16} className="text-slate-400" />
                  <div className="text-left">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</p>
                     <p className="text-xs font-bold text-slate-700">{user?.department_name || 'General Administration'}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-100">
                  <Shield size={16} className="text-slate-400" />
                  <div className="text-left">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Access Level</p>
                     <p className="text-xs font-bold text-slate-700">{user?.role} Permissions</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="erp-card bg-white border border-slate-200 p-8 relative overflow-hidden shadow-sm">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Shield size={120} />
             </div>
             <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4 relative z-10">Security Notice</h3>
             <p className="text-sm text-slate-500 font-medium leading-relaxed relative z-10 mb-6">
               Your account is protected by enterprise-grade encryption. Ensure your password is at least 12 characters long with mixed cases.
             </p>
             <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest relative z-10">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                System Integrity Secure
             </div>
          </div>
        </div>

        {/* Settings Forms */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="erp-card bg-white p-10 border border-slate-200 shadow-sm"
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-erp-blue/10 text-erp-blue flex items-center justify-center">
                <Key size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Security Credentials</h3>
                <p className="text-sm text-slate-500 font-bold">Update your authentication password</p>
              </div>
            </div>

            {message && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-2xl flex items-center gap-3 mb-8 border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}
              >
                {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <p className="text-sm font-bold">{message.text}</p>
              </motion.div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Current Secret Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 transition-all font-bold text-slate-900"
                    placeholder="Enter current password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">New Secure Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 transition-all font-bold text-slate-900"
                      placeholder="Min. 8 characters"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Verify New Password</label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="password"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 transition-all font-bold text-slate-900"
                      placeholder="Repeat new password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all"
                >
                  {loading ? 'Processing...' : <><Save size={18} className="inline mr-2" /> <span>Save New Credentials</span></>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
