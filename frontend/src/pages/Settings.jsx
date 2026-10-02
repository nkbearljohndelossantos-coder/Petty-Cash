import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Settings as SettingsIcon, Bell, Shield, 
  Palette, Globe, Database, HelpCircle,
  Sun, Save, RefreshCcw,
  Building, Wallet, Coins, Lock, Mail,
  CheckCircle2, AlertCircle, ShieldCheck,
  Key, Copy, Check, Eye, EyeOff, Code, Terminal, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

import Users from './Users';
import ApprovalSettingsPanel from '../components/ApprovalSettingsPanel';

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
    admin_email: '',
    expense_units: '[]'
  });
  const [unitsList, setUnitsList] = useState([]);
  const [newUnit, setNewUnit] = useState('');
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_enabled: true,
    in_app_enabled: true
  });

  // API Key & Webhooks State
  // API Key & Webhooks State
  const [apiKey, setApiKey] = useState('NkbPayablesApiKey2026');
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [activeDocTab, setActiveDocTab] = useState('curl');

  // FMS Outbound Integration State
  const [fmsUrl, setFmsUrl] = useState('https://fms.nkbmanufacturing.com/api/payables');
  const [fmsApiKey, setFmsApiKey] = useState('nkb_inv_live_6ae6965c1ca61aef54939d6b1ecfac1b');
  const [showFmsKey, setShowFmsKey] = useState(false);
  const [fmsAutoSync, setFmsAutoSync] = useState(true);
  const [fmsTesting, setFmsTesting] = useState(false);
  const [fmsTestStatus, setFmsTestStatus] = useState(null);
  const [fmsSaving, setFmsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchNotificationPrefs();
    if (isSuperAdmin) {
      fetchApiKey();
      fetchFmsConfig();
    }
  }, [isSuperAdmin]);

  const fetchApiKey = async () => {
    try {
      const res = await api.get('/settings/api-key');
      if (res?.data?.api_key) {
        setApiKey(res.data.api_key);
      }
    } catch (err) {
      console.error('Failed to fetch API key:', err);
    }
  };

  const fetchFmsConfig = async () => {
    try {
      const res = await api.get('/settings/fms-config');
      if (res?.data) {
        if (res.data.fms_api_url) setFmsUrl(res.data.fms_api_url);
        if (res.data.fms_api_key) setFmsApiKey(res.data.fms_api_key);
        if (res.data.fms_auto_sync !== undefined) setFmsAutoSync(res.data.fms_auto_sync);
      }
    } catch (err) {
      console.error('Failed to fetch FMS config:', err);
    }
  };

  const handleSaveFmsConfig = async (e) => {
    if (e) e.preventDefault();
    setFmsSaving(true);
    try {
      await api.put('/settings/fms-config', {
        fms_api_url: fmsUrl,
        fms_api_key: fmsApiKey,
        fms_auto_sync: fmsAutoSync
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save FMS config: ' + (err.response?.data?.message || err.message));
    } finally {
      setFmsSaving(false);
    }
  };

  const handleTestFmsConnection = async () => {
    setFmsTesting(true);
    setFmsTestStatus(null);
    try {
      const res = await api.post('/settings/test-fms-sync', {
        fms_api_url: fmsUrl,
        fms_api_key: fmsApiKey
      });
      setFmsTestStatus({
        success: Boolean(res?.success),
        message: res?.message || (res?.success ? 'Connected successfully!' : 'Connection failed')
      });
    } catch (err) {
      setFmsTestStatus({
        success: false,
        message: err.response?.data?.message || err.message || 'Connection test failed'
      });
    } finally {
      setFmsTesting(false);
    }
  };

  const handleGenerateApiKey = async () => {
    if (!window.confirm('Are you sure you want to generate a new API Key? External systems using the old key will need to be updated.')) {
      return;
    }
    setGeneratingKey(true);
    try {
      const res = await api.post('/settings/generate-api-key');
      if (res?.data?.api_key) {
        setApiKey(res.data.api_key);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      alert('Failed to generate API Key: ' + (err.response?.data?.message || err.message));
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleSaveCustomKey = async (e) => {
    e.preventDefault();
    if (!customKeyInput.trim() || customKeyInput.trim().length < 8) {
      alert('Custom API Key must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await api.put('/settings/api-key', { api_key: customKeyInput.trim() });
      if (res?.data?.api_key) {
        setApiKey(res.data.api_key);
        setCustomKeyInput('');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      alert('Failed to save API key: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyApiKey = (keyToCopy = apiKey) => {
    navigator.clipboard.writeText(keyToCopy);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const fetchSettings = async () => {
    try {
      const data = await api.get('/settings');
      if (data) {
        setSettings(data);
        try {
          const parsed = JSON.parse(data.expense_units || '[]');
          setUnitsList(Array.isArray(parsed) ? parsed : []);
        } catch {
          setUnitsList([]);
        }
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

  const handleSaveUnits = async () => {
    setLoading(true);
    try {
      await api.put('/settings', { expense_units: JSON.stringify(unitsList) });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save units');
    } finally {
      setLoading(false);
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
    { name: 'Master Data', icon: Globe },
    { name: 'Approval', icon: ShieldCheck },
    ...(isSuperAdmin ? [{ name: 'API & Webhooks', icon: Key }] : []),
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
            {activeTab === 'Users' 
              ? 'Access Governance' 
              : activeTab === 'API & Webhooks'
                ? 'API Keys & Webhooks'
                : 'System Configuration'}
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {activeTab === 'Users' 
              ? 'Manage personnel roles, credentials, and system permissions.' 
              : activeTab === 'API & Webhooks'
                ? 'Generate API keys, manage webhook tokens, and integrate external approval systems.'
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

               {activeTab === 'Master Data' && (
                  <div className="space-y-8">
                     <div className="pb-6 border-b border-slate-100">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Units of Measure</h3>
                        <p className="text-sm text-slate-500 font-medium">Options shown in the Expenses form (Box, Piece, etc.).</p>
                     </div>
                     <div className="flex gap-3">
                        <input
                          type="text"
                          className="flex-1 px-5 py-3 border border-slate-200 rounded-xl font-bold"
                          placeholder="New unit (e.g. Sack)"
                          value={newUnit}
                          onChange={(e) => setNewUnit(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newUnit.trim()) {
                              e.preventDefault();
                              if (!unitsList.includes(newUnit.trim())) {
                                setUnitsList([...unitsList, newUnit.trim()]);
                              }
                              setNewUnit('');
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newUnit.trim() && !unitsList.includes(newUnit.trim())) {
                              setUnitsList([...unitsList, newUnit.trim()]);
                            }
                            setNewUnit('');
                          }}
                          className="px-6 py-3 bg-erp-blue text-white rounded-xl text-xs font-black uppercase"
                        >
                          Add
                        </button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {unitsList.map((u) => (
                          <span key={u} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold">
                            {u}
                            <button type="button" onClick={() => setUnitsList(unitsList.filter(x => x !== u))} className="text-rose-500 hover:text-rose-700">×</button>
                          </span>
                        ))}
                     </div>
                     <button onClick={handleSaveUnits} disabled={loading} className="btn-erp btn-erp-primary">
                        {loading ? 'Saving...' : 'Save Units'}
                     </button>
                     <p className="text-xs text-slate-400">Cost centers: open Cost Centers in the sidebar to add or edit departments.</p>
                  </div>
               )}

               {activeTab === 'Approval' && <ApprovalSettingsPanel />}

               {activeTab === 'API & Webhooks' && isSuperAdmin && (
                  <div className="space-y-8">
                     <div className="pb-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                           <h3 className="text-xl font-black text-slate-900 tracking-tight">API Keys & External Integrations</h3>
                           <p className="text-sm text-slate-500 font-medium">Manage master API keys, webhooks, and third-party payable approval relays.</p>
                        </div>
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold w-fit">
                           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                           API Gateway Active
                        </span>
                     </div>

                     {/* Primary API Key Card */}
                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                           <div>
                              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Master Integration Key (`x-api-key`)</label>
                              <p className="text-xs text-slate-500 mt-0.5">Use this secret key to authenticate all external API requests and webhooks.</p>
                           </div>
                           <div className="flex items-center gap-2">
                              <button
                                 type="button"
                                 onClick={handleGenerateApiKey}
                                 disabled={generatingKey}
                                 className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                              >
                                 <Sparkles size={14} className={generatingKey ? 'animate-spin' : 'text-amber-400'} />
                                 <span>{generatingKey ? 'Generating...' : 'Generate New Key'}</span>
                              </button>
                           </div>
                        </div>

                        <div className="flex items-center gap-2">
                           <div className="relative flex-1">
                              <input
                                 type={showKey ? 'text' : 'password'}
                                 readOnly
                                 className="w-full pl-4 pr-12 py-3 bg-white border border-slate-300 rounded-xl font-mono text-sm font-black text-slate-900 outline-none select-all"
                                 value={apiKey}
                              />
                              <button
                                 type="button"
                                 onClick={() => setShowKey(!showKey)}
                                 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                                 title={showKey ? 'Hide API Key' : 'Show API Key'}
                              >
                                 {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                           </div>

                           <button
                              type="button"
                              onClick={() => handleCopyApiKey(apiKey)}
                              className={`px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                                 copiedKey 
                                    ? 'bg-emerald-600 text-white' 
                                    : 'bg-erp-blue hover:bg-blue-700 text-white'
                              }`}
                           >
                              {copiedKey ? <Check size={16} /> : <Copy size={16} />}
                              <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                           </button>
                        </div>

                        {/* Custom Key Form */}
                        <form onSubmit={handleSaveCustomKey} className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
                           <input
                              type="text"
                              placeholder="Set custom API key (min. 8 characters)..."
                              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                              value={customKeyInput}
                              onChange={(e) => setCustomKeyInput(e.target.value)}
                           />
                           <button
                              type="submit"
                              disabled={loading || !customKeyInput.trim()}
                              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                           >
                              Save Custom Key
                           </button>
                        </form>
                     </div>

                     {/* FMS Outbound Approval Sync Section */}
                     <div className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl border border-indigo-500/30 text-white shadow-xl space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-500/20">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                                 <Globe size={20} />
                              </div>
                              <div>
                                 <h4 className="text-base font-black tracking-tight flex items-center gap-2">
                                    FMS Approval Integration
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 text-[10px] font-bold">
                                       fms.nkbmanufacturing.com
                                    </span>
                                 </h4>
                                 <p className="text-xs text-indigo-200/70 font-medium">Awtomatikong ipapasa ang mga bagong Payable Request sa FMS para sa COO Approval.</p>
                              </div>
                           </div>

                           <div className="flex items-center gap-2">
                              <button
                                 type="button"
                                 onClick={handleTestFmsConnection}
                                 disabled={fmsTesting}
                                 className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/30 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                              >
                                 <RefreshCcw size={14} className={fmsTesting ? 'animate-spin' : ''} />
                                 <span>{fmsTesting ? 'Testing...' : 'Test Connection'}</span>
                              </button>
                           </div>
                        </div>

                        {/* Test Status Banner */}
                        {fmsTestStatus && (
                           <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 border ${
                              fmsTestStatus.success 
                                 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                                 : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                           }`}>
                              {fmsTestStatus.success ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                              <div className="flex-1">
                                 <p className="font-bold">{fmsTestStatus.success ? 'FMS Connection Verified!' : 'FMS Connection Failed'}</p>
                                 <p className="text-[11px] opacity-80 mt-0.5">{fmsTestStatus.message}</p>
                              </div>
                           </div>
                        )}

                        <form onSubmit={handleSaveFmsConfig} className="space-y-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                 <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-200/80 mb-1.5 block">
                                    FMS Endpoint URL
                                 </label>
                                 <input
                                    type="text"
                                    value={fmsUrl}
                                    onChange={(e) => setFmsUrl(e.target.value)}
                                    placeholder="https://fms.nkbmanufacturing.com/api/payables"
                                    className="w-full px-4 py-2.5 bg-indigo-950/60 border border-indigo-400/20 rounded-xl text-xs font-mono font-medium text-indigo-100 placeholder-indigo-300/40 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                                 />
                              </div>

                              <div>
                                 <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-200/80 mb-1.5 block">
                                    FMS Live API Key (x-api-key)
                                 </label>
                                 <div className="relative">
                                    <input
                                       type={showFmsKey ? 'text' : 'password'}
                                       value={fmsApiKey}
                                       onChange={(e) => setFmsApiKey(e.target.value)}
                                       placeholder="nkb_inv_live_..."
                                       className="w-full px-4 py-2.5 pr-10 bg-indigo-950/60 border border-indigo-400/20 rounded-xl text-xs font-mono font-medium text-emerald-400 placeholder-indigo-300/40 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                    <button
                                       type="button"
                                       onClick={() => setShowFmsKey(!showFmsKey)}
                                       className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-white"
                                    >
                                       {showFmsKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                 </div>
                              </div>
                           </div>

                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-indigo-500/20">
                              <label className="flex items-center gap-3 cursor-pointer">
                                 <input
                                    type="checkbox"
                                    checked={fmsAutoSync}
                                    onChange={(e) => setFmsAutoSync(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-indigo-400/40 bg-indigo-950"
                                 />
                                 <span className="text-xs text-indigo-100 font-medium">
                                    Awtomatikong ipadala sa FMS kapag gumawa ng bagong Payable Request
                                 </span>
                              </label>

                              <button
                                 type="submit"
                                 disabled={fmsSaving}
                                 className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                 <Save size={15} />
                                 <span>{fmsSaving ? 'Saving...' : 'Save FMS Config'}</span>
                              </button>
                           </div>
                        </form>
                     </div>

                     {/* Header Format Box */}
                     <div className="p-5 bg-blue-50/70 rounded-2xl border border-blue-200">
                        <div className="flex items-start gap-3">
                           <Key className="text-blue-600 shrink-0 mt-0.5" size={20} />
                           <div className="flex-1">
                              <h4 className="text-xs font-black uppercase tracking-wider text-blue-900">HTTP Header Specification</h4>
                              <p className="text-xs text-blue-700 mt-1">Include this header with every request to the Petty Cash & Payables API:</p>
                              <div className="mt-2 p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl flex items-center justify-between">
                                 <code>x-api-key: {apiKey}</code>
                                 <button 
                                    type="button" 
                                    onClick={() => handleCopyApiKey(`x-api-key: ${apiKey}`)} 
                                    className="text-slate-400 hover:text-white text-[11px] font-bold underline"
                                 >
                                    Copy Header
                                 </button>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Developer Quickstart & Code Examples */}
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <h4 className="text-base font-black text-slate-900">Integration Examples</h4>
                           <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                              {['curl', 'javascript', 'python'].map(lang => (
                                 <button
                                    key={lang}
                                    type="button"
                                    onClick={() => setActiveDocTab(lang)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                       activeDocTab === lang 
                                          ? 'bg-white text-slate-900 shadow-sm' 
                                          : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                 >
                                    {lang === 'curl' ? 'cURL' : lang === 'javascript' ? 'Node.js / JS' : 'Python'}
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
                           {activeDocTab === 'curl' && (
                              <pre className="leading-relaxed whitespace-pre-wrap">
{`# 1. Fetch All Payables
curl -X GET "https://pc.nkbmanufacturing.com/api/payables" \\
  -H "x-api-key: ${apiKey}"

# 2. Submit Payable Request
curl -X POST "https://pc.nkbmanufacturing.com/api/payables" \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "company": "NKB Manufacturing Corporation",
    "vendor": "Supplier Name",
    "gross_amount": 15000,
    "term": "Net 30",
    "description": "Raw Materials Batch"
  }'

# 3. Approve / Confirm Payable (by ID)
curl -X POST "https://pc.nkbmanufacturing.com/api/payables/1/approve" \\
  -H "x-api-key: ${apiKey}"`}
                              </pre>
                           )}

                           {activeDocTab === 'javascript' && (
                              <pre className="leading-relaxed whitespace-pre-wrap">
{`// Node.js (Axios)
const axios = require('axios');

const API = axios.create({
  baseURL: 'https://pc.nkbmanufacturing.com/api',
  headers: {
    'x-api-key': '${apiKey}',
    'Content-Type': 'application/json'
  }
});

// 1. Get All Payables
const { data } = await API.get('/payables');

// 2. Approve Payable
await API.post('/payables/1/approve');

// 3. COO Confirmation
await API.post('/payables/1/confirm');`}
                              </pre>
                           )}

                           {activeDocTab === 'python' && (
                              <pre className="leading-relaxed whitespace-pre-wrap">
{`import requests

headers = {
    "x-api-key": "${apiKey}",
    "Content-Type": "application/json"
}

# 1. Fetch Payables
res = requests.get("https://pc.nkbmanufacturing.com/api/payables", headers=headers)
print(res.json())

# 2. Approve Payable
requests.post("https://pc.nkbmanufacturing.com/api/payables/1/approve", headers=headers)`}
                              </pre>
                           )}
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
