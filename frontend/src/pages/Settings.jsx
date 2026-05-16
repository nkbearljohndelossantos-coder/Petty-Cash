import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Settings as SettingsIcon, Bell, Shield, 
  Palette, Globe, Database, HelpCircle,
  Sun, Save, RefreshCcw,
  Building, Wallet, Coins, Lock, Mail,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

import Users from './Users';

const Settings = () => {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'Super Admin';
  const [activeTab, setActiveTab] = useState('General');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    company_name: '',
    currency: 'PHP',
    petty_cash_limit: 0,
    admin_email: ''
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_enabled: true,
    in_app_enabled: true
  });

  useEffect(() => {
    fetchSettings();
    fetchNotificationPrefs();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await api.get('/settings');
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const fetchNotificationPrefs = async () => {
    try {
      const data = await api.get('/notifications/preferences');
      if (data) {
        setNotificationPrefs(data);
      }
    } catch (err) {
      console.error('Failed to fetch notification prefs:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/settings', settings);
      await api.put('/notifications/preferences', notificationPrefs);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDB = async () => {
    if (!window.confirm('SYSTEM DATA RESET: This will permanently DELETE ALL TRANSACTION DATA (Expenses, Funds, Activity Logs, and Attachments). User accounts, departments, and categories will be PRESERVED. Proceed?')) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/settings/clear-transactions');
      alert(res.message || 'Database has been wiped. Redirecting to login...');
      logout();
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
      alert('System reset failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { name: 'General', icon: SettingsIcon },
    { name: 'Users', icon: Shield },
    { name: 'Notifications', icon: Bell },
    { name: 'Appearance', icon: Palette },
    { name: 'Security', icon: Lock },
    { name: 'System', icon: Database }
  ];

  return (
    <div className="space-y-8 fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {activeTab === 'Users' ? 'Access Governance' : 'System Configuration'}
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {activeTab === 'Users' 
              ? 'Manage personnel roles, credentials, and system permissions.' 
              : 'Global preferences and administrative settings.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-white px-4 py-2 rounded-xl border border-emerald-200 shadow-sm"
              >
                <CheckCircle2 size={16} />
                <span>Preferences Sync Completed</span>
              </motion.div>
            )}
          </AnimatePresence>
          {['General', 'Notifications'].includes(activeTab) && (
            <button 
              onClick={handleSave} 
              disabled={loading}
              className="btn-erp btn-erp-primary"
            >
              {loading ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />}
              <span>{loading ? 'Syncing...' : 'Save Changes'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Sidebar Tabs */}
         <div className="space-y-2">
            {tabs.map((tab) => (
               <button 
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === tab.name ? 'bg-erp-blue text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-400 hover:text-slate-900 border border-slate-100'}`}
               >
                  <tab.icon size={20} />
                  <span>{tab.name}</span>
               </button>
            ))}
         </div>

         {/* Content Area */}
         <div className="lg:col-span-3 space-y-8">
            <motion.div 
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className={`${activeTab === 'Users' ? '' : 'erp-card p-10 bg-white shadow-sm border border-slate-200'}`}
            >
               {activeTab === 'Users' && <Users isEmbedded={true} />}
               
               {activeTab === 'General' && (
                  <div className="space-y-8">
                     <div className="pb-6 border-b border-slate-100">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Enterprise Identity</h3>
                        <p className="text-sm text-slate-500 font-medium">Define your organization's core system parameters.</p>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Name</label>
                           <div className="relative">
                              <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <input 
                                 type="text" 
                                 className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900"
                                 value={settings.company_name}
                                 onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System Currency</label>
                           <div className="relative">
                              <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <input 
                                 type="text" 
                                 className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900"
                                 value={settings.currency}
                                 onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Petty Cash Reservoir Limit</label>
                           <div className="relative">
                              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <input 
                                 type="number" 
                                 className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-black text-slate-900"
                                 value={settings.petty_cash_limit}
                                 onChange={(e) => setSettings({ ...settings, petty_cash_limit: e.target.value })}
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Master Administrator Email</label>
                           <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <input 
                                 type="email" 
                                 className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900"
                                 value={settings.admin_email}
                                 onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                              />
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {activeTab === 'Notifications' && (
                  <div className="space-y-8">
                     <div className="pb-6 border-b border-slate-100">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Notification Channels</h3>
                        <p className="text-sm text-slate-500 font-medium">Choose how you want to receive system alerts and reports.</p>
                     </div>
                     
                     <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 group hover:border-blue-200 transition-all">
                           <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                 <Mail size={24} />
                              </div>
                              <div>
                                 <h4 className="font-bold text-slate-900">Email Notifications</h4>
                                 <p className="text-xs text-slate-500 font-medium mt-0.5">Receive reports and approval alerts via email.</p>
                              </div>
                           </div>
                           <button 
                              onClick={() => setNotificationPrefs({ ...notificationPrefs, email_enabled: !notificationPrefs.email_enabled })}
                              className={`w-16 h-8 rounded-full relative transition-all duration-300 ${notificationPrefs.email_enabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                           >
                              <motion.div 
                                 animate={{ x: notificationPrefs.email_enabled ? 32 : 4 }}
                                 className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                              />
                           </button>
                        </div>

                        <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 group hover:border-blue-200 transition-all">
                           <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                 <Bell size={24} />
                              </div>
                              <div>
                                 <h4 className="font-bold text-slate-900">In-App Notifications</h4>
                                 <p className="text-xs text-slate-500 font-medium mt-0.5">Show real-time alerts in the dashboard header.</p>
                              </div>
                           </div>
                           <button 
                              onClick={() => setNotificationPrefs({ ...notificationPrefs, in_app_enabled: !notificationPrefs.in_app_enabled })}
                              className={`w-16 h-8 rounded-full relative transition-all duration-300 ${notificationPrefs.in_app_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                           >
                              <motion.div 
                                 animate={{ x: notificationPrefs.in_app_enabled ? 32 : 4 }}
                                 className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                              />
                           </button>
                        </div>
                     </div>

                     <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                        <div className="flex gap-4">
                           <AlertCircle className="text-amber-500 shrink-0" size={20} />
                           <div>
                              <p className="text-xs font-black text-amber-900 uppercase tracking-widest mb-1">Important Note</p>
                              <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                 Some critical system alerts, such as security breaches or password resets, will always be sent via email regardless of your preferences.
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {activeTab === 'Appearance' && (
                  <div className="space-y-10 text-center py-10">
                     <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Sun size={40} className="text-emerald-500" />
                     </div>
                     <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pure White Experience</h3>
                     <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">The system is currently locked to the High-Contrast White theme for maximum clarity and professionalism.</p>
                     <div className="mt-8 flex items-center justify-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400">
                        <span>Dynamic mode disabled by Policy</span>
                     </div>
                  </div>
               )}

               {activeTab === 'Security' && (
                  <div className="space-y-8">
                     <div className="pb-6 border-b border-slate-100 text-rose-600">
                        <h3 className="text-xl font-black tracking-tight">Security Hardening</h3>
                        <p className="text-sm text-rose-400 font-medium italic">Advanced authentication and credential protection.</p>
                     </div>
                     <div className="space-y-6 max-w-md">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Current Authorization Key</label>
                           <input type="password" placeholder="••••••••••••" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-black tracking-widest" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Access Credential</label>
                           <input type="password" placeholder="Min. 12 characters" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-black tracking-widest" />
                        </div>
                        <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all w-full">Update Credentials</button>
                     </div>
                  </div>
               )}

               {activeTab === 'System' && (
                  <div className="space-y-8">
                     <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-20 h-20 bg-white border border-slate-100 shadow-sm rounded-[2.5rem] flex items-center justify-center mb-6">
                           <Database size={40} className="text-slate-200" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Engine Diagnostics</h3>
                        <p className="text-sm font-medium mt-1 max-w-sm">Automated maintenance and backup logs are performed every 24 hours.</p>
                        <div className="mt-8 flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                           <CheckCircle2 size={18} />
                           <span className="text-xs font-black uppercase tracking-widest">Database Optimization Active</span>
                        </div>
                     </div>

                     {isSuperAdmin && (
                        <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 mt-10">
                           <div className="flex items-start gap-6">
                              <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-600/20 shrink-0">
                                 <RefreshCcw size={28} />
                              </div>
                              <div className="flex-1">
                                 <h4 className="text-lg font-black text-slate-900 tracking-tight uppercase">Transaction Data Wipe</h4>
                                 <p className="text-sm text-slate-600 font-medium mt-1">
                                    Permanently delete all transaction records (Expenses, Funds, Logs, Notifications). User accounts and departments will be preserved.
                                 </p>
                                 <button 
                                    onClick={handleResetDB}
                                    disabled={loading}
                                    className="mt-6 px-10 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
                                 >
                                    {loading ? 'Clearing Data...' : 'Clear All Transaction Records'}
                                 </button>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               )}
            </motion.div>

            <div className="erp-card p-10 bg-white border border-rose-200 group shadow-sm">
               <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                     <RefreshCcw size={28} />
                  </div>
                  <div className="flex-1">
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">Enterprise Cache Purge</h3>
                     <p className="text-sm text-slate-500 font-medium mt-1">Force clear all system preferences and session logs. This action may cause temporary service interruptions.</p>
                     <button className="mt-6 px-8 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20">Purge Configuration Data</button>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Settings;
