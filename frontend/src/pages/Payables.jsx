import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Search, Filter, Eye, CheckCircle2, XCircle, 
  FileText, Check, AlertCircle, Clock, DollarSign, 
  Building2, Calendar, Paperclip, Download, Printer, 
  Share2, ShieldCheck, CreditCard, ArrowRight, RefreshCw,
  ExternalLink, Copy, CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Payables = () => {
  const { user } = useAuth();
  const [payables, setPayables] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showChequeModal, setShowChequeModal] = useState(false);
  const [showRelayModal, setShowRelayModal] = useState(false);

  const [selectedPayable, setSelectedPayable] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [relayData, setRelayData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    supplier_name: '',
    invoice_no: '',
    department_id: '',
    gross_amount: '',
    ewt_rate: 0,
    due_date: '',
    remarks: '',
    attachments: []
  });

  // Cheque Form State
  const [chequeData, setChequeData] = useState({
    bank_name: 'BDO Unibank',
    cheque_number: '',
    cheque_date: new Date().toISOString().split('T')[0],
    released_to: '',
    remarks: ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayables();
    fetchDepartments();
  }, [statusFilter, departmentFilter]);

  const fetchPayables = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (departmentFilter) params.department_id = departmentFilter;
      if (search) params.search = search;

      const res = await api.get('/payables', { params });
      if (res.data?.success) {
        setPayables(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load payables:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPayables();
  };

  // EWT & Net Calculations
  const gross = parseFloat(formData.gross_amount) || 0;
  const ewtRate = parseFloat(formData.ewt_rate) || 0;
  const ewtAmount = (gross * ewtRate) / 100;
  const netAmount = gross - ewtAmount;

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('supplier_name', formData.supplier_name);
      payload.append('invoice_no', formData.invoice_no);
      payload.append('department_id', formData.department_id || (user?.department_id || ''));
      payload.append('gross_amount', formData.gross_amount);
      payload.append('ewt_rate', formData.ewt_rate);
      payload.append('due_date', formData.due_date);
      payload.append('remarks', formData.remarks);

      if (formData.attachments && formData.attachments.length > 0) {
        for (let i = 0; i < formData.attachments.length; i++) {
          payload.append('attachments', formData.attachments[i]);
        }
      }

      await api.post('/payables', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setShowCreateModal(false);
      setFormData({
        supplier_name: '',
        invoice_no: '',
        department_id: '',
        gross_amount: '',
        ewt_rate: 0,
        due_date: '',
        remarks: '',
        attachments: []
      });
      fetchPayables();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to submit payable requisition');
    } finally {
      setSubmitting(false);
    }
  };

  // Actions
  const handleApprove = async (id) => {
    if (!window.confirm('Approve this payable requisition for COO Confirmation?')) return;
    try {
      await api.put(`/payables/${id}/approve`);
      fetchPayables();
      if (selectedPayable?.id === id) setShowDetailModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    try {
      await api.put(`/payables/${selectedPayable.id}/reject`, { rejection_reason: rejectReason });
      setShowRejectModal(false);
      setRejectReason('');
      fetchPayables();
      setShowDetailModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    }
  };

  const handleCOOConfirm = async (id) => {
    if (!window.confirm('Confirm and Clear this payable for Cheque Issuance as COO?')) return;
    try {
      await api.put(`/payables/${id}/confirm`);
      fetchPayables();
      if (selectedPayable?.id === id) setShowDetailModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'COO Confirmation failed');
    }
  };

  const handleIssueChequeSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/payables/${selectedPayable.id}/cheque`, chequeData);
      setShowChequeModal(false);
      setChequeData({
        bank_name: 'BDO Unibank',
        cheque_number: '',
        cheque_date: new Date().toISOString().split('T')[0],
        released_to: '',
        remarks: ''
      });
      fetchPayables();
      setShowDetailModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Cheque issuance failed');
    }
  };

  const handleMarkCleared = async (id) => {
    if (!window.confirm('Mark this cheque as Cleared in bank records?')) return;
    try {
      await api.put(`/payables/${id}/clear`);
      fetchPayables();
      if (selectedPayable?.id === id) setShowDetailModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Clearing failed');
    }
  };

  const handleGenerateRelay = async (payable, action = 'APPROVE') => {
    try {
      const res = await api.post(`/payables/${payable.id}/relay-approval`, { action });
      if (res.data?.success) {
        setRelayData(res.data.data);
        setShowRelayModal(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate relay link');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // KPI Calculations
  const pendingCount = payables.filter(p => p.status === 'Pending Approval').length;
  const confirmedCount = payables.filter(p => p.status === 'Confirmed').length;
  const issuedCount = payables.filter(p => p.status === 'Cheque Issued').length;
  const totalOutstanding = payables
    .filter(p => ['Pending Approval', 'Approved', 'Confirmed'].includes(p.status))
    .reduce((acc, curr) => acc + parseFloat(curr.net_amount || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending Approval':
        return <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1.5"><Clock size={12} /> Pending Approval</span>;
      case 'Approved':
        return <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold flex items-center gap-1.5"><CheckCircle2 size={12} /> Approved (Pending COO)</span>;
      case 'Confirmed':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5"><ShieldCheck size={12} /> COO Confirmed</span>;
      case 'Cheque Issued':
        return <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-bold flex items-center gap-1.5"><CreditCard size={12} /> Cheque Issued</span>;
      case 'Cleared':
        return <span className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-bold flex items-center gap-1.5"><CheckCheck size={12} /> Cleared</span>;
      case 'Rejected':
        return <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold flex items-center gap-1.5"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const isCOOorAdmin = user?.role === 'Super Admin' || user?.role === 'COO';
  const isAccounting = user?.role === 'Super Admin' || user?.role === 'Accounting';
  const isManager = user?.role === 'Manager' || user?.role === 'Super Admin' || user?.role === 'COO';

  return (
    <div className="space-y-8 fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Cheque Payables & Requisitions</h1>
          <p className="text-slate-500 font-medium mt-1">Manage large supplier payables, COO clearing authorizations, and cheque disbursements.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-erp btn-erp-primary flex items-center gap-2"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>New Payable Requisition</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="erp-card bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Pending Approval</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-4">{pendingCount}</p>
          <p className="text-xs text-slate-400 font-bold mt-1">Awaiting manager review</p>
        </div>

        <div className="erp-card bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">COO Confirmed</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-4">{confirmedCount}</p>
          <p className="text-xs text-slate-400 font-bold mt-1">Ready for cheque printing</p>
        </div>

        <div className="erp-card bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Cheques Issued</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-4">{issuedCount}</p>
          <p className="text-xs text-slate-400 font-bold mt-1">Pending bank clearing</p>
        </div>

        <div className="erp-card bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Outstanding</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-erp-blue flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-4">PHP {totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 font-bold mt-1">Unreleased cheque obligations</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="erp-card bg-white border border-slate-200 p-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900 text-sm"
              placeholder="Search by Requisition #, Supplier Name, Invoice #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <select 
              className="px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Confirmed">COO Confirmed</option>
              <option value="Cheque Issued">Cheque Issued</option>
              <option value="Cleared">Cleared</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select 
              className="px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900 text-sm"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <button type="submit" className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-wider hover:bg-black transition-all">
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Payables Ledger Table */}
      <div className="erp-card bg-white border border-slate-200 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="py-4 px-6">Requisition #</th>
                <th className="py-4 px-6">Supplier Entity</th>
                <th className="py-4 px-6">Invoice Ref</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Gross Amount</th>
                <th className="py-4 px-6">EWT</th>
                <th className="py-4 px-6">Net Payable</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center text-slate-400">
                    <div className="w-8 h-8 border-4 border-erp-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs font-bold uppercase tracking-wider">Loading Payables Ledger...</p>
                  </td>
                </tr>
              ) : payables.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center text-slate-400">
                    <FileText size={40} className="mx-auto mb-3 text-slate-300 stroke-1" />
                    <p className="text-base font-bold text-slate-700">No Payable Requisitions Found</p>
                    <p className="text-xs text-slate-400 mt-1">Submit a new requisition or adjust your filters above.</p>
                  </td>
                </tr>
              ) : (
                payables.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono font-black text-slate-900">{p.requisition_no}</span>
                      <p className="text-[11px] text-slate-400">{new Date(p.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">{p.supplier_name}</td>
                    <td className="py-4 px-6 text-slate-600 font-mono text-xs">{p.invoice_no || '—'}</td>
                    <td className="py-4 px-6 text-slate-600 text-xs font-bold">{p.department_name || 'General'}</td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-600">PHP {parseFloat(p.gross_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">{p.ewt_rate}% (PHP {parseFloat(p.ewt_amount).toFixed(2)})</td>
                    <td className="py-4 px-6 font-mono font-black text-slate-900">PHP {parseFloat(p.net_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-6">{getStatusBadge(p.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => { setSelectedPayable(p); setShowDetailModal(true); }}
                          title="View Details & Documents"
                          className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
                        >
                          <Eye size={18} />
                        </button>

                        {/* Quick Approve for Manager/Admin */}
                        {p.status === 'Pending Approval' && isManager && (
                          <button 
                            onClick={() => handleApprove(p.id)}
                            title="Approve Requisition"
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-colors"
                          >
                            <Check size={18} />
                          </button>
                        )}

                        {/* COO Confirmation */}
                        {(p.status === 'Approved' || p.status === 'Pending Approval') && isCOOorAdmin && (
                          <button 
                            onClick={() => handleCOOConfirm(p.id)}
                            title="COO Confirmation & Clearing"
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-erp-blue rounded-xl transition-colors font-bold text-xs flex items-center gap-1"
                          >
                            <ShieldCheck size={18} />
                          </button>
                        )}

                        {/* Cheque Issuance for Accounting */}
                        {p.status === 'Confirmed' && isAccounting && (
                          <button 
                            onClick={() => { setSelectedPayable(p); setShowChequeModal(true); }}
                            title="Issue Cheque"
                            className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-colors"
                          >
                            <CreditCard size={18} />
                          </button>
                        )}

                        {/* Mark Cleared for Accounting */}
                        {p.status === 'Cheque Issued' && isAccounting && (
                          <button 
                            onClick={() => handleMarkCleared(p.id)}
                            title="Mark Cheque Cleared"
                            className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl transition-colors"
                          >
                            <CheckCheck size={18} />
                          </button>
                        )}

                        {/* Relay Approval Link */}
                        {['Pending Approval', 'Approved'].includes(p.status) && (
                          <button 
                            onClick={() => handleGenerateRelay(p, isCOOorAdmin ? 'COO_CONFIRM' : 'APPROVE')}
                            title="Generate Direct Approval Relay Link"
                            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
                          >
                            <Share2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Create Payable Requisition */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">New Payable Requisition</h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">Submit supplier invoice details for cheque processing</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Supplier / Payee Name *</label>
                    <input 
                      type="text" required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900 text-sm"
                      placeholder="e.g. Acme Industrial Supply Inc."
                      value={formData.supplier_name}
                      onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Billing / Invoice Ref #</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900 text-sm"
                      placeholder="e.g. SI-2026-8994"
                      value={formData.invoice_no}
                      onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Cost Center / Department</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900 text-sm"
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Payment Due Date</label>
                    <input 
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900 text-sm"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Amount & EWT Calculator */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Gross Invoice Amount (PHP) *</label>
                      <input 
                        type="number" step="0.01" min="0.01" required
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-black text-slate-900 text-base"
                        placeholder="0.00"
                        value={formData.gross_amount}
                        onChange={(e) => setFormData({ ...formData, gross_amount: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Withholding Tax (EWT / BIR 2307)</label>
                      <select 
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900 text-sm"
                        value={formData.ewt_rate}
                        onChange={(e) => setFormData({ ...formData, ewt_rate: e.target.value })}
                      >
                        <option value="0">0% — None</option>
                        <option value="1">1% — Goods Purchase</option>
                        <option value="2">2% — Services / Subcontractor</option>
                        <option value="5">5% — Rental / Professional Fee</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs font-bold text-slate-600">
                    <span>Tax Withheld (EWT): <strong className="text-slate-900">PHP {ewtAmount.toFixed(2)}</strong></span>
                    <span className="text-sm font-black text-erp-blue">Net Cheque Amount: PHP {netAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Supporting Invoices / Quotation (Max 10 files)</label>
                  <input 
                    type="file" multiple
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white"
                    onChange={(e) => setFormData({ ...formData, attachments: e.target.files })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Remarks / Justification</label>
                  <textarea 
                    rows="2"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-medium text-slate-900 text-sm"
                    placeholder="Provide purpose of requisition or special terms..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-erp btn-erp-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-erp btn-erp-primary flex-1">
                    {submitting ? 'Submitting...' : 'Submit Requisition'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Details Modal */}
      <AnimatePresence>
        {showDetailModal && selectedPayable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-6 my-8"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-slate-900">{selectedPayable.requisition_no}</h3>
                    {getStatusBadge(selectedPayable.status)}
                  </div>
                  <p className="text-xs text-slate-400 font-bold mt-1">Submitted by {selectedPayable.requestor_name || 'System'}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Supplier Name</p>
                  <p className="text-sm font-black text-slate-900 mt-1">{selectedPayable.supplier_name}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Invoice Number</p>
                  <p className="text-sm font-mono font-bold text-slate-900 mt-1">{selectedPayable.invoice_no || 'N/A'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Gross Amount</p>
                  <p className="text-sm font-mono font-black text-slate-900 mt-1">PHP {parseFloat(selectedPayable.gross_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Net Cheque Amount</p>
                  <p className="text-sm font-mono font-black text-erp-blue mt-1">PHP {parseFloat(selectedPayable.net_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Attachments Section */}
              {selectedPayable.attachments && selectedPayable.attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attached Invoices & Documents</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedPayable.attachments.map(att => (
                      <a 
                        key={att.id}
                        href={`/uploads/${att.file_path}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 transition-colors"
                      >
                        <Paperclip size={16} className="text-slate-400" />
                        <span className="truncate flex-1">{att.file_name}</span>
                        <ExternalLink size={14} className="text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Cheque Info if Issued */}
              {selectedPayable.cheques && selectedPayable.cheques.length > 0 && (
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                  <div className="flex items-center gap-2 text-purple-900 font-black text-xs uppercase tracking-wider">
                    <CreditCard size={16} />
                    <span>Issued Cheque Details</span>
                  </div>
                  {selectedPayable.cheques.map(c => (
                    <div key={c.id} className="text-xs text-purple-900 space-y-1">
                      <p>Bank: <strong>{c.bank_name}</strong> | Cheque #: <strong className="font-mono">{c.cheque_number}</strong></p>
                      <p>Date on Cheque: <strong>{new Date(c.cheque_date).toLocaleDateString()}</strong></p>
                      {c.released_to && <p>Released To: <strong>{c.released_to}</strong></p>}
                      {c.cleared_at && <p className="text-emerald-700 font-bold">✓ Cleared on {new Date(c.cleared_at).toLocaleDateString()}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Rejection notice */}
              {selectedPayable.rejection_reason && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800 space-y-1">
                  <p className="font-black">Rejection Reason:</p>
                  <p>{selectedPayable.rejection_reason}</p>
                </div>
              )}

              {/* Action Buttons in Modal */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 justify-end">
                {selectedPayable.status === 'Pending Approval' && isManager && (
                  <button onClick={() => handleApprove(selectedPayable.id)} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700">
                    Approve
                  </button>
                )}

                {['Pending Approval', 'Approved'].includes(selectedPayable.status) && isManager && (
                  <button onClick={() => setShowRejectModal(true)} className="px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-100">
                    Reject
                  </button>
                )}

                {(selectedPayable.status === 'Approved' || selectedPayable.status === 'Pending Approval') && isCOOorAdmin && (
                  <button onClick={() => handleCOOConfirm(selectedPayable.id)} className="px-5 py-2.5 bg-erp-blue text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700">
                    COO Confirm & Clear
                  </button>
                )}

                {selectedPayable.status === 'Confirmed' && isAccounting && (
                  <button onClick={() => setShowChequeModal(true)} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-purple-700">
                    Issue Cheque
                  </button>
                )}

                {selectedPayable.status === 'Cheque Issued' && isAccounting && (
                  <button onClick={() => handleMarkCleared(selectedPayable.id)} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-teal-700">
                    Mark Bank Cleared
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 3: Issue Cheque Modal */}
      <AnimatePresence>
        {showChequeModal && selectedPayable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Record Cheque Issuance</h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">For {selectedPayable.requisition_no} ({selectedPayable.supplier_name})</p>
                </div>
                <button onClick={() => setShowChequeModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleIssueChequeSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Bank Account *</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 text-sm"
                    value={chequeData.bank_name}
                    onChange={(e) => setChequeData({ ...chequeData, bank_name: e.target.value })}
                  >
                    <option value="BDO Unibank">BDO Unibank (Main Operating)</option>
                    <option value="Bank of the Philippine Islands (BPI)">BPI (Disbursement)</option>
                    <option value="Metrobank">Metrobank (Treasury)</option>
                    <option value="UnionBank">UnionBank (Corporate)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Cheque Number *</label>
                  <input 
                    type="text" required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-black text-slate-900 text-sm"
                    placeholder="e.g. 000492819"
                    value={chequeData.cheque_number}
                    onChange={(e) => setChequeData({ ...chequeData, cheque_number: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Cheque Date *</label>
                  <input 
                    type="date" required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 text-sm"
                    value={chequeData.cheque_date}
                    onChange={(e) => setChequeData({ ...chequeData, cheque_date: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Released To (Person / Courier)</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 text-sm"
                    placeholder="e.g. Juan Santos (Supplier Rep)"
                    value={chequeData.released_to}
                    onChange={(e) => setChequeData({ ...chequeData, released_to: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowChequeModal(false)} className="btn-erp btn-erp-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-3.5 bg-purple-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-purple-700 flex-1">
                    Issue Cheque
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 4: Rejection Reason */}
      <AnimatePresence>
        {showRejectModal && selectedPayable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6"
            >
              <h3 className="text-xl font-black text-slate-900">Reject Payable Requisition</h3>
              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Mandatory Rejection Reason</label>
                  <textarea 
                    required rows="3"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-900 text-sm outline-none focus:ring-4 focus:ring-rose-500/10"
                    placeholder="State reason for rejecting this requisition..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  ></textarea>
                </div>
                <div className="flex gap-4 pt-2">
                  <button type="button" onClick={() => setShowRejectModal(false)} className="btn-erp btn-erp-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-3.5 bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-rose-700 flex-1">
                    Confirm Reject
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 5: Approval Relay Link Modal */}
      <AnimatePresence>
        {showRelayModal && relayData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Approval Relay Link</h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">Secure 1-click tokenized approval link</p>
                </div>
                <button onClick={() => setShowRelayModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Send this link to the designated approver or COO via chat, SMS, or email. Clicking the link will instantly execute the approval without requiring full credentials.
                </p>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 break-all select-all">
                  {relayData.approval_url}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>Action: <strong>{relayData.action}</strong></span>
                  <span>Valid for 48 hours</span>
                </div>

                <button 
                  type="button" 
                  onClick={() => copyToClipboard(relayData.approval_url)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  {copiedLink ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                  <span>{copiedLink ? 'Copied to Clipboard!' : 'Copy Approval Link'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payables;
