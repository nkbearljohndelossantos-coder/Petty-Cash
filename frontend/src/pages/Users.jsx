import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Plus, Search, Edit, Trash2, X, Check, 
  User, Shield, Mail, Phone, Calendar,
  MoreVertical, Lock, UserPlus, ShieldCheck,
  Building2, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Users = ({ isEmbedded = false }) => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'Staff',
    email: '',
    department_id: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentUser) {
        await api.put(`/users/${currentUser.id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (user) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      password: '', 
      full_name: user.full_name,
      role: user.role,
      email: user.email || '',
      department_id: user.department_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const roles = ['Super Admin', 'Accounting', 'Manager', 'Staff'];

  return (
    <div className={`space-y-8 fade-in ${!isEmbedded ? 'pb-20' : ''}`}>
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Access Governance</h1>
            <p className="text-slate-500 font-medium mt-1">Manage personnel roles, credentials, and system permissions.</p>
          </div>
          <button 
            onClick={() => { 
              setCurrentUser(null); 
              setFormData({ username: '', password: '', full_name: '', role: 'Staff', email: '', department_id: '' }); 
              setShowModal(true); 
            }}
            className="btn-erp btn-erp-primary"
          >
            <UserPlus size={20} strokeWidth={2.5} />
            <span>Provision User</span>
          </button>
        </div>
      )}

      {isEmbedded && (
        <div className="flex justify-end mb-4">
           <button 
            onClick={() => { 
              setCurrentUser(null); 
              setFormData({ username: '', password: '', full_name: '', role: 'Staff', email: '', department_id: '' }); 
              setShowModal(true); 
            }}
            className="btn-erp btn-erp-primary"
          >
            <UserPlus size={20} strokeWidth={2.5} />
            <span>Provision User</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4 text-slate-400">
             <div className="w-10 h-10 border-4 border-erp-blue border-t-transparent rounded-full animate-spin"></div>
             <p className="text-xs font-black uppercase tracking-widest">Auditing Directories...</p>
          </div>
        ) : users.map((user, i) => (
          <motion.div 
            key={user.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="erp-card p-0 overflow-hidden group bg-white border border-slate-200"
          >
            <div className={`h-2 bg-gradient-to-r ${user.role === 'Super Admin' ? 'from-rose-500 to-orange-500' : user.role === 'Accounting' ? 'from-emerald-500 to-teal-500' : 'from-erp-blue to-indigo-500'}`}></div>
            <div className="p-8">
               <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                     <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center text-2xl font-black shadow-lg border-4 border-white ${user.role === 'Super Admin' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-erp-blue'}`}>
                        {user.full_name.split(' ').map(n => n[0]).join('')}
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{user.full_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                           <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${user.role === 'Super Admin' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                              {user.role}
                           </span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">@{user.username}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-2 relative z-10">
                     <button 
                       onClick={() => handleEdit(user)} 
                       className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 hover:text-erp-blue hover:bg-blue-50 border border-slate-100 flex items-center justify-center transition-all shadow-sm"
                       title="Edit User"
                     >
                       <Edit size={14} />
                     </button>
                     <button 
                       onClick={() => handleDelete(user.id)} 
                       className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-100 flex items-center justify-center transition-all shadow-sm"
                       title="Delete User"
                     >
                       <Trash2 size={14} />
                     </button>
                  </div>
               </div>

               <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3 text-slate-500">
                     <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center"><Building2 size={14} /></div>
                     <span className="text-sm font-bold tracking-tight">{user.department_name || 'Global Enterprise'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                     <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center"><Mail size={14} /></div>
                     <span className="text-[11px] font-bold tracking-tight lowercase">{user.email || 'no-email@nkb.com'}</span>
                  </div>
               </div>

               <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <ShieldCheck size={14} className="text-emerald-500" />
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Credentials</span>
                  </div>
                  <button onClick={() => handleEdit(user)} className="text-[10px] font-black text-erp-blue uppercase tracking-[0.15em] hover:underline">Edit Policy</button>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowModal(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
             />
             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden p-12 border border-slate-200"
             >
                <div className="mb-10 text-center">
                   <div className="w-20 h-20 bg-erp-blue/10 rounded-[2.5rem] flex items-center justify-center text-erp-blue mx-auto mb-6">
                      <Shield size={40} strokeWidth={2.5} />
                   </div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{currentUser ? 'Manage Security Profile' : 'Access Provisioning'}</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">NKB Manufacturing Security Center</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account ID</label>
                         <input 
                           type="text" required
                           className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900"
                           value={formData.username}
                           onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Tier</label>
                         <select 
                           className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-black text-slate-900"
                           value={formData.role}
                           onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                         >
                            {roles.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                         </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2 col-span-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Legal Full Name</label>
                         <input 
                           type="text" required
                           className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900"
                           value={formData.full_name}
                           onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department</label>
                         <select 
                           className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900"
                           value={formData.department_id}
                           onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                         >
                            <option value="">Global/Admin</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                         <input 
                           type="email" 
                           className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900"
                           value={formData.email}
                           onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                         />
                      </div>
                   </div>

                   {!currentUser && (
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Initial Authorization Key</label>
                         <div className="relative">
                            <input 
                              type="password" required
                              className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-black tracking-widest text-slate-900"
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <Lock size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" />
                         </div>
                      </div>
                   )}
                   
                   <div className="flex gap-4 pt-8">
                      <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex-1">Discard</button>
                      <button type="submit" className="px-8 py-4 bg-erp-blue text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition-all flex-1">Authorize Access</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;
