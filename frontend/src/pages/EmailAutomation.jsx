import React, { useState, useEffect } from 'react';
import { 
  Bell, Plus, Search, Calendar, History, FileText, Send, 
  AlertCircle, CheckCircle2, Clock, Trash2, Archive, User, 
  Users, Check, Info, X, Zap, AlertTriangle, Layers, ShieldCheck, 
  ExternalLink, ArrowRight, Eye, RefreshCw, BarChart2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationCenterPage = () => {
  const { user } = useAuth();
  const { refreshNotifications } = useSocket();
  const isAdmin = ['Super Admin', 'Accounting'].includes(user?.role);
  
  const [activeTab, setActiveTab] = useState('inbox');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Admin Lists
  const [templates, setTemplates] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [sentList, setSentList] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('broadcast'); // broadcast, template, schedule
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedSentNotif, setSelectedSentNotif] = useState(null);

  // Form States
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    priority: 'normal',
    category: 'general',
    recipients_type: 'all',
    recipients_data: [],
    attachment_url: '',
    task_link: ''
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    body: '',
    type: 'info'
  });

  const [scheduleForm, setScheduleForm] = useState({
    template_id: '',
    title: '',
    message: '',
    priority: 'normal',
    recipients_type: 'all',
    recipients_data: [],
    schedule_time: '',
    frequency: 'once'
  });

  // Available departments list for multi-recipient targeting
  const departments = ['Management', 'Accounting', 'Audit', 'Super Admin', 'Operations'];

  useEffect(() => {
    fetchData();

    const handleNewNotif = () => {
      console.log('Real-time notification update received in page');
      fetchData();
    };

    window.addEventListener('new_notification', handleNewNotif);
    return () => {
      window.removeEventListener('new_notification', handleNewNotif);
    };
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'inbox') {
        const data = await api.get('/notifications?status=active');
        if (data) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } else if (activeTab === 'important') {
        const data = await api.get('/notifications?status=active&priority=important');
        const criticalData = await api.get('/notifications?status=active&priority=critical');
        if (data && criticalData) {
          setNotifications([...(criticalNotifs(criticalData.notifications)), ...(data.notifications || [])]);
        }
      } else if (activeTab === 'archived') {
        const data = await api.get('/notifications?status=archived');
        if (data) setNotifications(data.notifications || []);
      } else if (activeTab === 'sent' && isAdmin) {
        const data = await api.get('/email-automation/logs');
        setSentList(data || []);
        
        // Fetch users for broadcast targeting
        const usersData = await api.get('/users');
        setSystemUsers(usersData || []);
      } else if (activeTab === 'schedules' && isAdmin) {
        const data = await api.get('/email-automation/schedules');
        setSchedules(data || []);
      } else if (activeTab === 'templates' && isAdmin) {
        const data = await api.get('/email-automation/templates');
        setTemplates(data || []);
      }
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const criticalNotifs = (list) => {
    return (list || []).map(n => ({ ...n, priority: 'critical' }));
  };

  // --- ACTIONS ---

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await api.put(`/notifications/${id}/acknowledge`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, acknowledged: true, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (id, archiveState = true) => {
    try {
      await api.put(`/notifications/${id}/archive`, { archive: archiveState });
      setNotifications(prev => prev.filter(n => n.id !== id));
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // --- FORM SUBMISSIONS ---

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...broadcastForm,
        recipients_data: broadcastForm.recipients_type === 'all' 
          ? [] 
          : broadcastForm.recipients_data
      };
      await api.post('/notifications/broadcast', data);
      setIsModalOpen(false);
      
      // Reset Form
      setBroadcastForm({
        title: '',
        message: '',
        priority: 'normal',
        category: 'general',
        recipients_type: 'all',
        recipients_data: [],
        attachment_url: '',
        task_link: ''
      });
      fetchData();
    } catch (err) {
      alert('Failed to send broadcast alert');
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await api.put(`/email-automation/templates/${editingTemplate.id}`, templateForm);
      } else {
        await api.post('/email-automation/templates', templateForm);
      }
      setIsModalOpen(false);
      setEditingTemplate(null);
      setTemplateForm({ name: '', subject: '', body: '', type: 'info' });
      fetchData();
    } catch (err) {
      alert('Failed to save template');
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...scheduleForm,
        recipients_data: scheduleForm.recipients_type === 'all' 
          ? [] 
          : scheduleForm.recipients_data
      };
      await api.post('/email-automation/schedules', data);
      setIsModalOpen(false);
      setScheduleForm({
        template_id: '',
        title: '',
        message: '',
        priority: 'normal',
        recipients_type: 'all',
        recipients_data: [],
        schedule_time: '',
        frequency: 'once'
      });
      fetchData();
    } catch (err) {
      alert('Failed to create schedule');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!confirm('Are you sure you want to delete this scheduled notification?')) return;
    try {
      await api.delete(`/email-automation/schedules/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete schedule');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.delete(`/email-automation/templates/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete template');
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse';
      case 'important': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryStyle = (cat) => {
    switch (cat) {
      case 'approval': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'finance': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'alert': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getReadStatusBadge = (status) => {
    switch (status) {
      case 'acknowledged': 
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit border border-amber-200"><CheckCircle2 size={12} className="text-amber-600 animate-bounce" /> Acknowledged</span>;
      case 'read': 
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit border border-emerald-200"><CheckCircle2 size={12} /> Read</span>;
      case 'delivered': 
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit border border-blue-200"><Clock size={12} /> Delivered</span>;
      default: 
        return <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit border border-slate-200"><Send size={12} /> Dispatched</span>;
    }
  };

  // Filtered Notifications
  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = !priorityFilter || n.priority === priorityFilter;
    const matchesCategory = !categoryFilter || n.category === categoryFilter;
    return matchesSearch && matchesPriority && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-[#0f172a] text-white rounded-2xl shadow-xl shadow-slate-900/10 relative">
              <Bell size={32} className="animate-swing duration-1000" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            Notification Center
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Enterprise-grade communication hub with real-time tracking, schedules, and priority warning systems.</p>
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setModalType('broadcast');
                setIsModalOpen(true);
              }}
              className="erp-button-primary py-3.5 px-6"
            >
              <Send size={18} />
              Broadcast Alert
            </button>
            <button 
              onClick={() => {
                setModalType('schedule');
                setIsModalOpen(true);
              }}
              className="erp-button-secondary py-3.5 px-6"
            >
              <Calendar size={18} />
              Schedule Alert
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/50 rounded-2xl w-fit border border-slate-100">
        {[
          { id: 'inbox', label: 'Inbox Feed', icon: Bell },
          { id: 'important', label: 'Important Alerts', icon: AlertTriangle },
          { id: 'archived', label: 'Archived Messages', icon: Archive },
          ...(isAdmin ? [
            { id: 'sent', label: 'Sent History & Analytics', icon: BarChart2 },
            { id: 'schedules', label: 'Automated Schedules', icon: Clock },
            { id: 'templates', label: 'Notification Templates', icon: FileText }
          ] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-md' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900"></div>
            <p className="text-slate-400 mt-4 font-bold text-sm">SYNCHRONIZING SECURE SYSTEMS...</p>
          </div>
        ) : (
          <div>
            {/* SEARCH AND FILTERS (For Inbox/Important Tabs) */}
            {['inbox', 'important', 'archived'].includes(activeTab) && (
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="w-full pl-12 pr-6 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-slate-900/5 font-medium text-slate-800 transition-all text-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <select
                    className="px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl outline-none font-bold text-slate-600 text-xs transition-all"
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                  >
                    <option value="">All Priorities</option>
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="critical">Critical</option>
                  </select>
                  <select
                    className="px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl outline-none font-bold text-slate-600 text-xs transition-all"
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    <option value="general">General</option>
                    <option value="approval">Administrative Approval</option>
                    <option value="finance">Treasury & Financials</option>
                    <option value="alert">System Alert</option>
                  </select>
                </div>
              </div>
            )}

            {/* INBOX & ALERTS FEED */}
            {['inbox', 'important', 'archived'].includes(activeTab) && (
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <Bell size={24} className="opacity-30" />
                    </div>
                    <p className="font-black text-slate-800 text-sm">No notifications found.</p>
                    <p className="text-xs text-slate-500 mt-1">All secure logs are clean.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-6 bg-white border rounded-[1.8rem] transition-all flex flex-col md:flex-row justify-between md:items-center gap-6 group hover:shadow-md hover:border-slate-300 relative overflow-hidden ${
                          !notif.is_read ? 'border-l-4 border-l-slate-900 border-slate-200 bg-slate-50/20' : 'border-slate-100'
                        }`}
                      >
                        {/* Flashing glow indicator if critical and unread */}
                        {notif.priority === 'critical' && !notif.acknowledged && (
                          <div className="absolute top-0 right-0 bottom-0 left-0 bg-rose-500/5 animate-pulse pointer-events-none" />
                        )}

                        <div className="flex gap-4 items-start">
                          <div className={`p-3.5 rounded-2xl ${
                            notif.priority === 'critical' ? 'bg-rose-50 text-rose-600' : 
                            (notif.priority === 'important' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500')
                          }`}>
                            {notif.priority === 'critical' ? <AlertCircle size={24} /> : (notif.priority === 'important' ? <AlertTriangle size={24} /> : <Info size={24} />)}
                          </div>
                          
                          <div className="space-y-1.5 max-w-xl">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className={`font-black tracking-tight ${!notif.is_read ? 'text-slate-900' : 'text-slate-600'}`}>{notif.title}</h3>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getPriorityStyle(notif.priority)}`}>
                                {notif.priority}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getCategoryStyle(notif.category)}`}>
                                {notif.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 font-bold block">
                              Received {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 relative z-10 shrink-0">
                          {/* Task Links */}
                          {notif.task_link && (
                            <a
                              href={notif.task_link}
                              className="px-4 py-2 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                            >
                              View Task
                              <ExternalLink size={12} />
                            </a>
                          )}

                          {/* Read/Acknowledge controls */}
                          {notif.priority === 'critical' && !notif.acknowledged && (
                            <button
                              onClick={() => handleAcknowledge(notif.id)}
                              className="px-4.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-rose-600/10 active:scale-95"
                            >
                              Acknowledge Alert
                            </button>
                          )}

                          {!notif.is_read && notif.priority !== 'critical' && (
                            <button
                              onClick={() => handleMarkRead(notif.id)}
                              className="px-4.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
                            >
                              Mark Read
                            </button>
                          )}

                          {/* Archive Recycler trigger */}
                          {activeTab === 'archived' ? (
                            <button
                              onClick={() => handleArchive(notif.id, false)}
                              className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Restore Notification"
                            >
                              <RefreshCw size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleArchive(notif.id, true)}
                              className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                              title="Archive Notification"
                            >
                              <Archive size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ADMIN SENT HISTORY & TRACKING ANALYTICS */}
            {activeTab === 'sent' && isAdmin && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Broadcast Audits</h3>
                    <p className="text-xs text-slate-400 font-semibold">Monitor delivery rates, read receipts, and acknowledge timestamps live.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left list */}
                  <div className="lg:col-span-2 space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {sentList.length === 0 ? (
                      <div className="py-20 text-center text-slate-400">No sent broadcasts configured yet.</div>
                    ) : (
                      sentList.map(item => (
                        <div 
                          key={item.id}
                          onClick={() => setSelectedSentNotif(item)}
                          className={`p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center gap-4 ${
                            selectedSentNotif?.id === item.id 
                              ? 'border-slate-900 bg-slate-50/50 shadow-sm' 
                              : 'border-slate-100 bg-white hover:border-slate-200'
                          }`}
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-950 truncate text-sm">{item.title}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getPriorityStyle(item.priority)}`}>
                                {item.priority}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate leading-relaxed">{item.message}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                              <span>By: {item.sender_username || 'System'}</span>
                              <span>•</span>
                              <span>{new Date(item.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black">
                              {item.tracking?.length || 0} Targets
                            </span>
                            <ArrowRight size={14} className="text-slate-400" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Right metrics detail viewer */}
                  <div className="bg-slate-50/50 border border-slate-200 rounded-[2rem] p-6 shadow-inner">
                    {selectedSentNotif ? (
                      <div className="space-y-6">
                        <div className="border-b border-slate-200/60 pb-4">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Selected Dispatch Audit</h4>
                          <h2 className="text-lg font-black text-slate-900 mt-2 leading-tight">{selectedSentNotif.title}</h2>
                          <span className={`px-3 py-1 mt-3 rounded-full text-[9px] font-black uppercase tracking-wider border inline-block ${getPriorityStyle(selectedSentNotif.priority)}`}>
                            {selectedSentNotif.priority}
                          </span>
                        </div>

                        {/* Read statistics progress bar */}
                        <div>
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Audits Analysis</h4>
                          {(() => {
                            const targets = selectedSentNotif.tracking || [];
                            const reads = targets.filter(t => ['read', 'acknowledged'].includes(t.status)).length;
                            const ack = targets.filter(t => t.status === 'acknowledged').length;
                            const pct = targets.length > 0 ? Math.round((reads / targets.length) * 100) : 0;
                            
                            return (
                              <div className="bg-white p-4 border border-slate-200 rounded-2xl space-y-3 shadow-sm">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                  <span>Read Rate</span>
                                  <span>{pct}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div className="bg-slate-900 h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold uppercase mt-2 pt-2 border-t border-slate-50">
                                  <div>Read: {reads}</div>
                                  <div>Acknowledge: {ack}</div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Individual user rows */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recipient Status Log</h4>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {selectedSentNotif.tracking?.map(t => (
                              <div key={t.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-4 shadow-sm">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">{t.full_name || t.username}</p>
                                  <span className="text-[9px] text-slate-400 font-semibold">{t.department}</span>
                                  {(t.status === 'read' || t.status === 'acknowledged') && (
                                    <span className="text-[8px] text-slate-400 font-bold block mt-0.5">
                                      {t.status === 'acknowledged' 
                                        ? `Ack: ${new Date(t.acknowledged_at).toLocaleTimeString()}`
                                        : `Read: ${new Date(t.read_at).toLocaleTimeString()}`}
                                    </span>
                                  )}
                                </div>
                                {getReadStatusBadge(t.status)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-20">
                        <BarChart2 size={48} className="opacity-20 mb-3" />
                        <p className="font-bold text-sm text-slate-500">No dispatch audited</p>
                        <p className="text-xs max-w-xs mt-1">Select a sent broadcast card on the left list to review detailed read statistics.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* AUTOMATED SCHEDULES (node-cron builder) */}
            {activeTab === 'schedules' && isAdmin && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Configured Cron Jobs</h3>
                    <p className="text-xs text-slate-400 font-semibold">Scheduled reminders and notifications auto-dispatched by node-cron.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {schedules.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                      <Calendar size={48} className="mx-auto opacity-20 mb-3" />
                      <p className="font-bold text-sm">No automated schedules configured.</p>
                      <p className="text-xs">Click "Schedule Alert" on top right to construct a cron reminder.</p>
                    </div>
                  ) : (
                    schedules.map(sched => (
                      <div key={sched.id} className="p-5 border border-slate-100 bg-white rounded-2xl flex justify-between items-center gap-6 shadow-sm hover:border-slate-200">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-950 text-sm">{sched.title}</h4>
                            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase border border-blue-100">
                              {sched.frequency}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getPriorityStyle(sched.priority)}`}>
                              {sched.priority}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">{sched.message}</p>
                          <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-semibold uppercase">
                            <span>Target: {sched.recipients_type} ({sched.recipients_data ? 'Custom' : 'All'})</span>
                            <span>•</span>
                            <span>Next Run: {new Date(sched.schedule_time).toLocaleString()}</span>
                            {sched.last_run && (
                              <>
                                <span>•</span>
                                <span>Last Dispatched: {new Date(sched.last_run).toLocaleString()}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            sched.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {sched.status}
                          </span>
                          <button 
                            onClick={() => handleDeleteSchedule(sched.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TEMPLATES VIEW */}
            {activeTab === 'templates' && isAdmin && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Standard presets</h3>
                    <p className="text-xs text-slate-400 font-semibold">Write preconfigured alerts templates for quick manual dispatching.</p>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingTemplate(null);
                      setTemplateForm({ name: '', subject: '', body: '', type: 'info' });
                      setModalType('template');
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Create Template
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-400">No template files saved.</div>
                  ) : (
                    templates.map(t => (
                      <div key={t.id} className="p-6 border border-slate-100 bg-white rounded-2xl flex flex-col justify-between gap-6 shadow-sm hover:border-slate-200">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-wider">
                              {t.type}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingTemplate(t);
                                  setTemplateForm({ name: t.name, subject: t.subject, body: t.body, type: t.type });
                                  setModalType('template');
                                  setIsModalOpen(true);
                                }}
                                className="p-2 text-slate-400 hover:text-slate-900 rounded-xl"
                              >
                                <Zap size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(t.id)}
                                className="p-2 text-slate-400 hover:text-rose-500 rounded-xl"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-black text-slate-950 text-base leading-snug">{t.name}</h4>
                          <p className="text-xs text-slate-500 font-bold leading-relaxed">{t.subject}</p>
                        </div>
                        <div className="pt-4 border-t border-slate-50">
                          <button
                            onClick={() => {
                              // Load template directly to broadcast form!
                              setBroadcastForm({
                                title: t.subject,
                                message: t.body,
                                priority: 'normal',
                                category: t.type === 'alert' ? 'alert' : 'general',
                                recipients_type: 'all',
                                recipients_data: [],
                                attachment_url: '',
                                task_link: ''
                              });
                              setModalType('broadcast');
                              setIsModalOpen(true);
                            }}
                            className="w-full py-2.5 bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            Load Template
                            <Eye size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MULTI-PURPOSE MODALS DRAWERS */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {modalType === 'broadcast' && 'Send Broadcast Alert'}
                  {modalType === 'template' && (editingTemplate ? 'Edit Preset Template' : 'Write Presets Template')}
                  {modalType === 'schedule' && 'Automated cron setup'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              {/* BROADCAST FORM */}
              {modalType === 'broadcast' && (
                <form onSubmit={handleSendBroadcast} className="p-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Priority urgency</label>
                      <select
                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-slate-900/5 font-bold text-slate-700 text-xs transition-all"
                        value={broadcastForm.priority}
                        onChange={e => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                      >
                        <option value="normal">Normal Priority</option>
                        <option value="important">Important Priority (Sound once)</option>
                        <option value="critical">Critical Alarm (Continuous looping klaxon!)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure category</label>
                      <select
                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-slate-900/5 font-bold text-slate-700 text-xs transition-all"
                        value={broadcastForm.category}
                        onChange={e => setBroadcastForm({ ...broadcastForm, category: e.target.value })}
                      >
                        <option value="general">General Announcement</option>
                        <option value="approval">Administrative Approval</option>
                        <option value="finance">Treasury & Financials</option>
                        <option value="alert">Critical Alerts</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Recipients scope</label>
                      <select
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-xs shadow-sm"
                        value={broadcastForm.recipients_type}
                        onChange={e => setBroadcastForm({ ...broadcastForm, recipients_type: e.target.value, recipients_data: [] })}
                      >
                        <option value="all">Broadcast to All Users</option>
                        <option value="department">Broadcast to Specific Departments</option>
                        <option value="users">Target Specific Staff</option>
                      </select>
                    </div>

                    {broadcastForm.recipients_type === 'department' && (
                      <div className="space-y-2 pt-3 border-t border-slate-200/55">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select departments</label>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {departments.map(dept => {
                            const active = broadcastForm.recipients_data.includes(dept);
                            return (
                              <button
                                type="button"
                                key={dept}
                                onClick={() => {
                                  setBroadcastForm({
                                    ...broadcastForm,
                                    recipients_data: active 
                                      ? broadcastForm.recipients_data.filter(d => d !== dept)
                                      : [...broadcastForm.recipients_data, dept]
                                  });
                                }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                                  active 
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                                }`}
                              >
                                {dept}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {broadcastForm.recipients_type === 'users' && (
                      <div className="space-y-2 pt-3 border-t border-slate-200/55">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select recipients</label>
                        <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-2 pt-1">
                          {systemUsers.map(u => {
                            const active = broadcastForm.recipients_data.includes(u.id);
                            return (
                              <div
                                key={u.id}
                                onClick={() => {
                                  setBroadcastForm({
                                    ...broadcastForm,
                                    recipients_data: active 
                                      ? broadcastForm.recipients_data.filter(id => id !== u.id)
                                      : [...broadcastForm.recipients_data, u.id]
                                  });
                                }}
                                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                  active ? 'border-slate-900 bg-slate-900/5 shadow-inner' : 'border-slate-100 bg-white hover:border-slate-200'
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">{u.full_name || u.username}</p>
                                  <span className="text-[9px] text-slate-400 font-semibold">{u.department} ({u.role})</span>
                                </div>
                                {active && <Check size={14} className="text-slate-900" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Alert Title</label>
                    <input
                      required
                      type="text"
                      placeholder="Warning summary / Topic heading..."
                      className="w-full px-6 py-4.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/5 font-bold text-slate-900 shadow-sm"
                      value={broadcastForm.title}
                      onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Detail alert message body</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Write exact dispatch instructions, warnings, or request approvals here..."
                      className="w-full px-6 py-5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/5 font-medium text-slate-700 leading-relaxed shadow-sm"
                      value={broadcastForm.message}
                      onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Attach task link (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. /expenses"
                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 shadow-sm text-xs"
                        value={broadcastForm.task_link}
                        onChange={e => setBroadcastForm({ ...broadcastForm, task_link: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Attachment media URL (Optional)</label>
                      <input
                        type="text"
                        placeholder="Public HTTPS URL link..."
                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 shadow-sm text-xs"
                        value={broadcastForm.attachment_url}
                        onChange={e => setBroadcastForm({ ...broadcastForm, attachment_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-50">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-8 py-4.5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4.5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                    >
                      Transmit Alert Live
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              )}

              {/* SCHEDULE FORM */}
              {modalType === 'schedule' && (
                <form onSubmit={handleCreateSchedule} className="p-10 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Trigger Execution Date & Time</label>
                      <input
                        required
                        type="datetime-local"
                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 shadow-sm text-xs"
                        value={scheduleForm.schedule_time}
                        onChange={e => setScheduleForm({ ...scheduleForm, schedule_time: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Recurrence Frequency</label>
                      <select
                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 shadow-sm text-xs"
                        value={scheduleForm.frequency}
                        onChange={e => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                      >
                        <option value="once">Once (No repetition)</option>
                        <option value="daily">Daily recurrence</option>
                        <option value="weekly">Weekly recurrence</option>
                        <option value="monthly">Monthly recurrence</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Template presets (Optional)</label>
                    <select
                      className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 shadow-sm text-xs"
                      value={scheduleForm.template_id}
                      onChange={e => {
                        const tId = e.target.value;
                        const match = templates.find(t => t.id === parseInt(tId));
                        if (match) {
                          setScheduleForm({
                            ...scheduleForm,
                            template_id: tId,
                            title: match.subject,
                            message: match.body,
                            priority: match.type === 'alert' ? 'critical' : 'normal'
                          });
                        } else {
                          setScheduleForm({ ...scheduleForm, template_id: tId });
                        }
                      }}
                    >
                      <option value="">Draft custom schedule</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Recipients scope</label>
                      <select
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-xs shadow-sm"
                        value={scheduleForm.recipients_type}
                        onChange={e => setScheduleForm({ ...scheduleForm, recipients_type: e.target.value, recipients_data: [] })}
                      >
                        <option value="all">Broadcast to All Users</option>
                        <option value="department">Broadcast to Specific Departments</option>
                      </select>
                    </div>

                    {scheduleForm.recipients_type === 'department' && (
                      <div className="space-y-2 pt-3 border-t border-slate-200/55">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select departments</label>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {departments.map(dept => {
                            const active = scheduleForm.recipients_data.includes(dept);
                            return (
                              <button
                                type="button"
                                key={dept}
                                onClick={() => {
                                  setScheduleForm({
                                    ...scheduleForm,
                                    recipients_data: active 
                                      ? scheduleForm.recipients_data.filter(d => d !== dept)
                                      : [...scheduleForm.recipients_data, dept]
                                  });
                                }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                                  active 
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                                }`}
                              >
                                {dept}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reminder Title</label>
                    <input
                      required
                      type="text"
                      className="w-full px-6 py-4.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/5 font-bold text-slate-900 shadow-sm"
                      value={scheduleForm.title}
                      onChange={e => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Detail alert message body</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full px-6 py-5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/5 font-medium text-slate-700 leading-relaxed shadow-sm"
                      value={scheduleForm.message}
                      onChange={e => setScheduleForm({ ...scheduleForm, message: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-50">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-8 py-4.5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4.5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                    >
                      Deploy Schedule Config
                      <Calendar size={16} />
                    </button>
                  </div>
                </form>
              )}

              {/* TEMPLATES BUILDER FORM */}
              {modalType === 'template' && (
                <form onSubmit={handleSaveTemplate} className="p-10 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reference Template Name</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Weekly_Audit_Notice"
                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 shadow-sm text-xs"
                        value={templateForm.name}
                        onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Classification Category</label>
                      <select
                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 shadow-sm text-xs"
                        value={templateForm.type}
                        onChange={e => setTemplateForm({ ...templateForm, type: e.target.value })}
                      >
                        <option value="info">General Announcement</option>
                        <option value="approval">Administrative Approval</option>
                        <option value="finance">Treasury & Financials</option>
                        <option value="alert">Critical Warnings</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Default Subject Line</label>
                    <input
                      required
                      type="text"
                      placeholder="Default title text..."
                      className="w-full px-6 py-4.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/5 font-bold text-slate-900 shadow-sm"
                      value={templateForm.subject}
                      onChange={e => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Default message body</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Default details text..."
                      className="w-full px-6 py-5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-slate-900/5 font-medium text-slate-700 leading-relaxed shadow-sm"
                      value={templateForm.body}
                      onChange={e => setTemplateForm({ ...templateForm, body: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-50">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-8 py-4.5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4.5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                    >
                      Save Preset template
                      <Check size={16} />
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenterPage;
