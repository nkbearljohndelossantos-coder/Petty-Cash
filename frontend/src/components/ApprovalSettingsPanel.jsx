import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Mail, DollarSign, Users, Plus, Trash2, Save, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ApprovalSettingsPanel = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    liquidation_approval_threshold: 10000,
    liquidation_approval_email_enabled: true,
    liquidation_approval_recipient_email: ''
  });
  const [approvers, setApprovers] = useState([]);
  const [newApprover, setNewApprover] = useState({ email: '', name: '', approval_level: 1 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, approversRes] = await Promise.all([
        api.get('/approval/settings'),
        api.get('/approval/approvers')
      ]);
      const data = settingsRes.data || settingsRes;
      setSettings({
        liquidation_approval_threshold: parseFloat(data.liquidation_approval_threshold) || 10000,
        liquidation_approval_email_enabled: data.liquidation_approval_email_enabled !== false,
        liquidation_approval_recipient_email: data.liquidation_approval_recipient_email || ''
      });
      setApprovers(approversRes.data || approversRes || []);
    } catch (err) {
      console.error('Failed to load approval settings:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/approval/settings', {
        liquidation_approval_threshold: settings.liquidation_approval_threshold,
        liquidation_approval_email_enabled: settings.liquidation_approval_email_enabled,
        liquidation_approval_recipient_email: settings.liquidation_approval_recipient_email
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddApprover = async () => {
    if (!newApprover.email.trim()) return;
    try {
      const res = await api.post('/approval/approvers', newApprover);
      setApprovers([...approvers, res.data || res]);
      setNewApprover({ email: '', name: '', approval_level: (approvers.length || 0) + 2 });
    } catch (err) {
      alert(err.message || 'Failed to add approver');
    }
  };

  const handleDeleteApprover = async (id) => {
    if (!window.confirm('Remove this approver?')) return;
    try {
      await api.delete(`/approval/approvers/${id}`);
      setApprovers(approvers.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to remove approver');
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Liquidation Approval Settings</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Configure threshold amounts and email approvers for high-value liquidations.
          </p>
        </div>
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-emerald-600 font-bold text-sm"
            >
              <CheckCircle2 size={16} />
              Saved
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Liquidation Approval Threshold (₱)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-black text-slate-900"
              value={settings.liquidation_approval_threshold}
              onChange={(e) =>
                setSettings({ ...settings, liquidation_approval_threshold: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <p className="text-xs text-slate-400 ml-1">
            Expenses at or above this amount require email approval before liquidation.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Primary Approver Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="email"
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900"
              placeholder="approver@company.com"
              value={settings.liquidation_approval_recipient_email}
              onChange={(e) =>
                setSettings({ ...settings, liquidation_approval_recipient_email: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Mail size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Enable Email Approval</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Send secure approve/decline links to the configured approver.
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            setSettings({
              ...settings,
              liquidation_approval_email_enabled: !settings.liquidation_approval_email_enabled
            })
          }
          className={`w-16 h-8 rounded-full relative transition-all duration-300 ${
            settings.liquidation_approval_email_enabled ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <motion.div
            animate={{ x: settings.liquidation_approval_email_enabled ? 32 : 4 }}
            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
          />
        </button>
      </div>

      <button onClick={handleSave} disabled={loading} className="btn-erp btn-erp-primary">
        {loading ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />}
        <span>{loading ? 'Saving...' : 'Save Approval Settings'}</span>
      </button>

      <div className="pt-8 border-t border-slate-100 space-y-6">
        <div className="flex items-center gap-3">
          <Users size={20} className="text-erp-blue" />
          <div>
            <h4 className="font-black text-slate-900">Additional Approvers (Multi-Level)</h4>
            <p className="text-xs text-slate-500">
              Add approvers for future multi-level approval chains. Level 1 is the primary email above.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            type="email"
            placeholder="Approver email"
            className="flex-1 min-w-[200px] px-4 py-3 border border-slate-200 rounded-xl font-bold"
            value={newApprover.email}
            onChange={(e) => setNewApprover({ ...newApprover, email: e.target.value })}
          />
          <input
            type="text"
            placeholder="Name (optional)"
            className="w-40 px-4 py-3 border border-slate-200 rounded-xl font-bold"
            value={newApprover.name}
            onChange={(e) => setNewApprover({ ...newApprover, name: e.target.value })}
          />
          <input
            type="number"
            min="2"
            placeholder="Level"
            className="w-24 px-4 py-3 border border-slate-200 rounded-xl font-bold"
            value={newApprover.approval_level}
            onChange={(e) =>
              setNewApprover({ ...newApprover, approval_level: parseInt(e.target.value) || 2 })
            }
          />
          <button
            type="button"
            onClick={handleAddApprover}
            className="px-6 py-3 bg-erp-blue text-white rounded-xl text-xs font-black uppercase flex items-center gap-2"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        {approvers.length > 0 && (
          <div className="space-y-2">
            {approvers.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl"
              >
                <div>
                  <p className="font-bold text-slate-900">{a.name || a.email}</p>
                  <p className="text-xs text-slate-500">
                    {a.email} · Level {a.approval_level}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteApprover(a.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalSettingsPanel;
