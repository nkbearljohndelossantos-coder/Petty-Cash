import React, { useState, useEffect } from 'react';
import { Mail, Plus, Search, Calendar, History, FileText, Send, AlertCircle, CheckCircle2, Clock, MoreVertical, Edit3, Trash2, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const EmailAutomation = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    type: 'info',
    greeting: '',
    mainMessage: '',
    details: '',
    closing: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'templates') {
        const data = await api.get('/email-automation/templates');
        setTemplates(data || []);
      } else if (activeTab === 'logs') {
        const data = await api.get('/email-automation/logs');
        setLogs(data || []);
      } else if (activeTab === 'schedules') {
        const data = await api.get('/email-automation/schedules');
        setSchedules(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (template = null) => {
    // Helper to convert {{code}} to [Human] labels for the UI
    const toHuman = (text) => {
      if (!text) return '';
      return text
        .replace(/{{name}}/g, '[Pangalan]')
        .replace(/{{amount}}/g, '[Halaga]')
        .replace(/{{status}}/g, '[Status]')
        .replace(/{{date}}/g, '[Petsa]')
        .replace(/{{balance}}/g, '[Balanse]')
        .replace(/{{requested_by}}/g, '[Requestor]');
    };

    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        subject: toHuman(template.subject),
        body: template.body,
        type: template.type,
        greeting: '', 
        mainMessage: toHuman(template.body.replace(/<[^>]*>?/gm, '')),
        details: '',
        closing: ''
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        subject: '',
        body: '',
        type: 'info',
        greeting: 'Magandang araw [Pangalan],',
        mainMessage: '',
        details: '',
        closing: 'Salamat, NKB Manufacturing'
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    
    // Helper to convert [Human] labels back to {{code}} for the system
    const toCode = (text) => {
      if (!text) return '';
      return text
        .replace(/\[Pangalan\]/g, '{{name}}')
        .replace(/\[Halaga\]/g, '{{amount}}')
        .replace(/\[Status\]/g, '{{status}}')
        .replace(/\[Petsa\]/g, '{{date}}')
        .replace(/\[Balanse\]/g, '{{balance}}')
        .replace(/\[Requestor\]/g, '{{requested_by}}');
    };

    const finalGreeting = toCode(formData.greeting);
    const finalMessage = toCode(formData.mainMessage);
    const finalDetails = toCode(formData.details);
    const finalClosing = toCode(formData.closing);
    const finalSubject = toCode(formData.subject);

    // Combine fields into a nice HTML body
    const finalBody = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 20px auto; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); overflow: hidden;">
        <div style="background: #0f172a; padding: 40px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.025em; font-weight: 800;">NKB Manufacturing</h2>
          <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 700;">Petty Cash Management System</p>
        </div>
        <div style="padding: 40px; color: #334155;">
          <p style="font-size: 18px; color: #0f172a; margin-bottom: 24px;"><strong>${finalGreeting}</strong></p>
          <div style="font-size: 16px; line-height: 1.7; color: #475569;">${finalMessage}</div>
          <div style="margin-top: 32px; padding: 24px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 12px;">
            <p style="margin: 0; font-size: 15px; color: #1e293b; font-weight: 500;">${finalDetails}</p>
          </div>
          <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="font-size: 13px; color: #94a3b8; font-weight: 600;">${finalClosing}</p>
            <p style="font-size: 11px; color: #cbd5e1; margin-top: 12px;">This is an automated official communication from NKB Manufacturing Petty Cash System.</p>
          </div>
        </div>
      </div>
    `;

    const dataToSave = {
      ...formData,
      subject: finalSubject,
      body: finalBody
    };

    try {
      if (editingTemplate) {
        await api.put(`/email-automation/templates/${editingTemplate.id}`, dataToSave);
      } else {
        await api.post('/email-automation/templates', dataToSave);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to save template');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent': return <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit"><CheckCircle2 size={12} /> Sent</span>;
      case 'failed': return <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit"><AlertCircle size={12} /> Failed</span>;
      case 'pending': return <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit"><Clock size={12} /> Pending</span>;
      default: return <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/20">
              <Mail size={32} />
            </div>
            Email Automation
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage notification templates, scheduled reports, and email logs.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="erp-button-secondary py-3.5 px-6">
            <History size={18} />
            Email Queue Monitor
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="erp-button-primary py-3.5 px-6"
          >
            <Plus size={18} />
            Create Template
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-2xl w-fit border border-slate-100">
        {[
          { id: 'templates', label: 'Email Templates', icon: FileText },
          { id: 'logs', label: 'Delivery Logs', icon: Send },
          { id: 'schedules', label: 'Automated Schedules', icon: Calendar }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-erp-blue shadow-md' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-erp-blue"></div>
            <p className="text-slate-500 mt-4 font-bold">Synchronizing data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {activeTab === 'templates' && (
                <>
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Template Name</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subject</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Updated</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(templates || []).map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                              {t.name[0].toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-900">{t.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm text-slate-600 truncate max-w-xs">{t.subject}</td>
                        <td className="px-8 py-5">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">{t.type}</span>
                        </td>
                        <td className="px-8 py-5 text-sm text-slate-500">{new Date(t.updated_at).toLocaleDateString()}</td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleOpenModal(t)}
                              className="p-2 text-slate-400 hover:text-erp-blue hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'logs' && (
                <>
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recipient</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subject</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date Sent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(logs || []).map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 font-bold text-slate-900">{log.recipient}</td>
                        <td className="px-8 py-5 text-sm text-slate-600">{log.subject}</td>
                        <td className="px-8 py-5">{getStatusBadge(log.status)}</td>
                        <td className="px-8 py-5 text-sm text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'schedules' && (
                <>
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reminder Task</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Target Template</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Frequency</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Next Execution</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(schedules || []).length > 0 ? (schedules.map(sched => (
                      <tr key={sched.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                              <Clock size={16} />
                            </div>
                            <span className="font-bold text-slate-900">{sched.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-600">{sched.template_name}</td>
                        <td className="px-8 py-5">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                            {sched.frequency}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm text-slate-500">{sched.next_run ? new Date(sched.next_run).toLocaleString() : 'Pending...'}</td>
                        <td className="px-8 py-5 text-right">
                          <span className={`px-3 py-1 ${sched.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'} rounded-full text-[10px] font-black uppercase tracking-wider`}>
                            {sched.active ? 'Active' : 'Paused'}
                          </span>
                        </td>
                      </tr>
                    ))) : (
                      <tr>
                        <td colSpan="5" className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-30">
                            <Calendar size={48} />
                            <p className="font-bold text-slate-500">No automated schedules configured yet.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Template Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveTemplate} className="p-10 space-y-12">
                {/* SECTION 1: TEMPLATE METADATA */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                    <div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">Official Communication Settings</h4>
                      <p className="text-xs text-slate-400 font-medium">Define the document purpose and classification.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Document Reference Name</label>
                      <input 
                        required
                        type="text" 
                        className="erp-input w-full px-6 py-4.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/10 font-bold text-slate-900 shadow-sm"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Audit_Success_Notice"
                        disabled={editingTemplate}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">System Classification</label>
                      <select 
                        className="erp-input w-full px-6 py-4.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/10 font-bold text-slate-900 shadow-sm"
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="info">General Announcement</option>
                        <option value="approval">Administrative Approval</option>
                        <option value="finance">Treasury & Financials</option>
                        <option value="alert">Critical System Alert</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: EMAIL CONTENT */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
                    <div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">Message Composition</h4>
                      <p className="text-xs text-slate-400 font-medium">Draft your professional correspondence using smart fields.</p>
                    </div>
                  </div>

                  {/* SMART FIELDS HELPER */}
                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-[2rem] shadow-inner">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap size={14} className="text-blue-600" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Available Smart Fields (Click to use)</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { tag: '[Pangalan]', label: 'Recipient Name' },
                        { tag: '[Halaga]', label: 'Currency Amount' },
                        { tag: '[Status]', label: 'Current Status' },
                        { tag: '[Petsa]', label: 'Effective Date' },
                        { tag: '[Balanse]', label: 'Remaining Balance' },
                        { tag: '[Requestor]', label: 'Submitted By' }
                      ].map(item => (
                        <button
                          key={item.tag}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, mainMessage: (formData.mainMessage || '') + ' ' + item.tag });
                          }}
                          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm active:scale-95"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Official Subject Line</label>
                      <input 
                        required
                        type="text" 
                        className="erp-input w-full px-6 py-5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/10 font-bold text-slate-900 shadow-sm"
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Subject Line..."
                      />
                    </div>

                    {/* COMPOSER FIELDS */}
                    <div className="grid grid-cols-1 gap-6 bg-white p-8 border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Salutation</label>
                        <input 
                          type="text" 
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-slate-800"
                          value={formData.greeting}
                          onChange={e => setFormData({ ...formData, greeting: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Main Body Text</label>
                        <textarea 
                          rows={4}
                          className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-slate-700 leading-relaxed"
                          value={formData.mainMessage}
                          onChange={e => setFormData({ ...formData, mainMessage: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Summary Details (Optional)</label>
                        <input 
                          type="text" 
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-slate-800"
                          value={formData.details}
                          onChange={e => setFormData({ ...formData, details: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Closing</label>
                        <input 
                          type="text" 
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-slate-800"
                          value={formData.closing}
                          onChange={e => setFormData({ ...formData, closing: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-10 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3"
                  >
                    Authorize & Deploy Template
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmailAutomation;
