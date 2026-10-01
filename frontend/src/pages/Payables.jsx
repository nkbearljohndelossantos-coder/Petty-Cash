import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Search, Filter, Eye, CheckCircle2, XCircle, 
  FileText, Check, AlertCircle, Clock, DollarSign, 
  Building2, Calendar, Paperclip, Download, Printer, 
  Share2, ShieldCheck, CreditCard, ArrowRight, ArrowLeft, RefreshCw,
  ExternalLink, Copy, CheckCheck, Trash2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BANK_ACCOUNTS = [
  { value: 'BDO: Norvin Bella (COOP) - 0080-5801-0563 (Avail: ₱650,000.00)', label: 'BDO: Norvin Bella (COOP) - 0080-5801-0563 (Avail: ₱650,000.00)' },
  { value: 'BDO: NKB Manufacturing Corporation - 0080-5801-0547 (Avail: ₱950,000.00)', label: 'BDO: NKB Manufacturing Corporation - 0080-5801-0547 (Avail: ₱950,000.00)' },
  { value: 'BDO: NKB Cosmetics Manufacturing - 0105-4800-4829 (Avail: ₱800,000.00)', label: 'BDO: NKB Cosmetics Manufacturing - 0105-4800-4829 (Avail: ₱800,000.00)' },
  { value: 'BDO: NKB Cosmetic Products Trading - 0105-4800-3245 (Avail: ₱700,000.00)', label: 'BDO: NKB Cosmetic Products Trading - 0105-4800-3245 (Avail: ₱700,000.00)' },
  { value: 'BDO: New Yra Enterprises - 0036-8801-3196 (Avail: ₱600,000.00)', label: 'BDO: New Yra Enterprises - 0036-8801-3196 (Avail: ₱600,000.00)' },
  { value: 'BDO: Vyuceutical - 0080-5801-0717 (Avail: ₱550,000.00)', label: 'BDO: Vyuceutical - 0080-5801-0717 (Avail: ₱550,000.00)' },
  { value: 'Security Bank: NKB Manufacturing Corporation - 0000079720871 (Avail: ₱500,000.00)', label: 'Security Bank: NKB Manufacturing Corporation - 0000079720871 (Avail: ₱500,000.00)' },
  { value: 'Metrobank: NKB Manufacturing Corporation - 788-7-78803245-1 (Avail: ₱750,000.00)', label: 'Metrobank: NKB Manufacturing Corporation - 788-7-78803245-1 (Avail: ₱750,000.00)' }
];

const EXPENSE_CATEGORIES = [
  'Raw Materials',
  'Packaging Materials',
  'Office Supplies',
  'Utilities',
  'Maintenance & Repairs',
  'Logistics & Shipping',
  'Marketing & Advertising',
  'Professional Fees',
  'Taxes & Licenses',
  'Other Expenses'
];

const INITIAL_COMPANIES = [
  'NKB Manufacturing Corporation',
  'Norvin Bella (COOP)',
  'NKB Cosmetics Manufacturing',
  'NKB Cosmetic Products Trading',
  'New Yra Enterprises',
  'Vyuceutical'
];

const Payables = () => {
  const { user } = useAuth();
  const [payables, setPayables] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [companies, setCompanies] = useState(INITIAL_COMPANIES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // View Mode: 'list' or 'create'
  const [viewMode, setViewMode] = useState('list');

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showChequeModal, setShowChequeModal] = useState(false);
  const [showRelayModal, setShowRelayModal] = useState(false);

  const [selectedPayable, setSelectedPayable] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [relayData, setRelayData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State matching the user's exact "Payable Request Form"
  const todayStr = new Date().toISOString().split('T')[0];
  const [formState, setFormState] = useState({
    company: 'NKB Manufacturing Corporation',
    invoice_number: '',
    date_created: todayStr,
    payable_number: 'PB-Auto',
    payable_category: 'Trade payable',
    invoice_date: todayStr,
    created_by: user?.full_name || 'Accountant',
    control_number: '',
    vendor: '',
    term: 'Net 30',
    due_date: calculateDueDate(todayStr, 'Net 30'),
    status: 'Submitted For Approval',
    description: '',
    bank_to_use: 'BDO: NKB Manufacturing Corporation - 0080-5801-0547 (Avail: ₱950,000.00)',
    comments: '',
    items: [
      { id: Date.now(), description: '', expense_category: 'Raw Materials', quantity: 1, cost: 0, subtotal: 0 }
    ],
    attachments: []
  });

  // Cheque Form State
  const [chequeData, setChequeData] = useState({
    bank_name: 'BDO Unibank',
    cheque_number: '',
    cheque_date: todayStr,
    released_to: '',
    remarks: ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayables();
    fetchDepartments();
  }, [statusFilter, departmentFilter]);

  function calculateDueDate(invoiceDate, term) {
    if (!invoiceDate) return '';
    const date = new Date(invoiceDate);
    if (isNaN(date.getTime())) return '';
    let daysToAdd = 30;
    if (term === 'Net 15') daysToAdd = 15;
    else if (term === 'Net 30') daysToAdd = 30;
    else if (term === 'Net 45') daysToAdd = 45;
    else if (term === 'Net 60') daysToAdd = 60;
    else if (term === 'COD' || term === 'Immediate') daysToAdd = 0;
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
  }

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

  // Item List Management
  const handleItemChange = (id, field, value) => {
    setFormState(prev => {
      const nextItems = prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'cost') {
            const q = parseFloat(field === 'quantity' ? value : updated.quantity) || 0;
            const c = parseFloat(field === 'cost' ? value : updated.cost) || 0;
            updated.subtotal = parseFloat((q * c).toFixed(2));
          }
          return updated;
        }
        return item;
      });
      return { ...prev, items: nextItems };
    });
  };

  const addItemRow = () => {
    setFormState(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { id: Date.now(), description: prev.description || '', expense_category: 'Raw Materials', quantity: 1, cost: 0, subtotal: 0 }
      ]
    }));
  };

  const removeItemRow = (id) => {
    if (formState.items.length === 1) {
      // Keep at least one row, just reset values
      setFormState(prev => ({
        ...prev,
        items: [{ id: Date.now(), description: '', expense_category: 'Raw Materials', quantity: 1, cost: 0, subtotal: 0 }]
      }));
      return;
    }
    setFormState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  // Totals
  const subtotal = formState.items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);
  const totalAmount = subtotal;
  const amountDue = totalAmount;

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formState.vendor.trim()) {
      alert('Please enter Vendor / Supplier Name');
      return;
    }
    if (amountDue <= 0) {
      alert('Please add item details with cost greater than ₱0.00');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('company', formState.company);
      payload.append('invoice_number', formState.invoice_number);
      payload.append('invoice_no', formState.invoice_number);
      payload.append('invoice_date', formState.invoice_date);
      payload.append('payable_category', formState.payable_category);
      payload.append('control_number', formState.control_number);
      payload.append('vendor', formState.vendor);
      payload.append('supplier_name', formState.vendor);
      payload.append('term', formState.term);
      payload.append('due_date', formState.due_date);
      payload.append('description', formState.description);
      payload.append('bank_to_use', formState.bank_to_use);
      payload.append('bank_account', formState.bank_to_use);
      payload.append('comments', formState.comments);
      payload.append('remarks', formState.comments);
      payload.append('gross_amount', amountDue.toString());
      payload.append('items', JSON.stringify(formState.items));

      if (formState.attachments && formState.attachments.length > 0) {
        for (let i = 0; i < formState.attachments.length; i++) {
          payload.append('attachments', formState.attachments[i]);
        }
      }

      const res = await api.post('/payables', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setViewMode('list');
        // Reset form
        setFormState({
          company: 'NKB Manufacturing Corporation',
          invoice_number: '',
          date_created: todayStr,
          payable_number: 'PB-Auto',
          payable_category: 'Trade payable',
          invoice_date: todayStr,
          created_by: user?.full_name || 'Accountant',
          control_number: '',
          vendor: '',
          term: 'Net 30',
          due_date: calculateDueDate(todayStr, 'Net 30'),
          status: 'Submitted For Approval',
          description: '',
          bank_to_use: 'BDO: NKB Manufacturing Corporation - 0080-5801-0547 (Avail: ₱950,000.00)',
          comments: '',
          items: [
            { id: Date.now(), description: '', expense_category: 'Raw Materials', quantity: 1, cost: 0, subtotal: 0 }
          ],
          attachments: []
        });
        fetchPayables();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to submit payable request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCompany = () => {
    const name = prompt('Enter new Company / Entity name:');
    if (name && name.trim()) {
      const trimmed = name.trim();
      if (!companies.includes(trimmed)) {
        setCompanies(prev => [...prev, trimmed]);
      }
      setFormState(prev => ({ ...prev, company: trimmed }));
    }
  };

  // Actions
  const handleApprove = async (id) => {
    if (!window.confirm('Approve this payable request for COO Confirmation?')) return;
    try {
      await api.post(`/payables/${id}/approve`);
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
      await api.post(`/payables/${selectedPayable.id}/reject`, { rejection_reason: rejectReason });
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
      await api.post(`/payables/${id}/coo-confirm`);
      fetchPayables();
      if (selectedPayable?.id === id) setShowDetailModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'COO Confirmation failed');
    }
  };

  const handleIssueChequeSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/payables/${selectedPayable.id}/issue-cheque`, chequeData);
      setShowChequeModal(false);
      setChequeData({
        bank_name: 'BDO Unibank',
        cheque_number: '',
        cheque_date: todayStr,
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
      await api.post(`/payables/${id}/clear-cheque`);
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
  const pendingCount = payables.filter(p => ['Pending Approval', 'Submitted For Approval'].includes(p.status)).length;
  const confirmedCount = payables.filter(p => p.status === 'Confirmed').length;
  const issuedCount = payables.filter(p => p.status === 'Cheque Issued').length;
  const totalOutstanding = payables
    .filter(p => ['Pending Approval', 'Submitted For Approval', 'Approved', 'Confirmed'].includes(p.status))
    .reduce((acc, curr) => acc + parseFloat(curr.gross_amount || curr.net_amount || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Submitted For Approval':
      case 'Pending Approval':
        return <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1.5"><Clock size={12} /> Submitted For Approval</span>;
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

  // =========================================================================
  // FULL PAGE VIEW: PAYABLE REQUEST FORM (NOT INSIDE A MODAL BOX)
  // =========================================================================
  if (viewMode === 'create') {
    return (
      <div className="space-y-6 fade-in pb-20 max-w-7xl mx-auto">
        {/* Top Header & Breadcrumb Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              onClick={() => setViewMode('list')}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center gap-2 font-bold text-sm"
              title="Back to Payables Ledger"
            >
              <ArrowLeft size={18} />
              <span>Back to Ledger</span>
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payable Request Form</h1>
              <p className="text-slate-500 text-xs font-medium mt-0.5">Submit supplier payable requisition with complete breakdown & accounting details.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => window.print()}
              title="Print Form"
              className="px-4 py-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <Printer size={16} />
              <span>Print Form</span>
            </button>
            <button 
              type="button" 
              onClick={() => setViewMode('list')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleCreateSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save & Submit'}
            </button>
          </div>
        </div>

        {/* Main Form Body Container (Full Page - NOT trapped in a popup box) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleCreateSubmit} className="space-y-6">
            {/* TOP GRID: 4 Columns per Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Row 1 - Col 1: Company */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Company</label>
                  <button 
                    type="button" 
                    onClick={handleAddCompany}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    + Add
                  </button>
                </div>
                <select 
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={formState.company}
                  onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                >
                  {companies.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Row 1 - Col 2: Invoice Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Invoice Number</label>
                <input 
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 transition-all"
                  placeholder="e.g. 239683"
                  value={formState.invoice_number}
                  onChange={(e) => setFormState({ ...formState, invoice_number: e.target.value })}
                />
              </div>

              {/* Row 1 - Col 3: Date Created */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Date Created</label>
                <input 
                  type="text"
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 text-sm cursor-not-allowed"
                  value={formState.date_created}
                />
              </div>

              {/* Row 1 - Col 4: Payable Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-blue-600 block">Payable Number</label>
                <input 
                  type="text"
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-black text-slate-800 text-sm cursor-not-allowed"
                  value={formState.payable_number}
                />
              </div>

              {/* Row 2 - Col 1: Payable Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Payable Category</label>
                <input 
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={formState.payable_category}
                  onChange={(e) => setFormState({ ...formState, payable_category: e.target.value })}
                />
              </div>

              {/* Row 2 - Col 2: Invoice Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Invoice Date</label>
                <input 
                  type="date"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={formState.invoice_date}
                  onChange={(e) => {
                    const newInvDate = e.target.value;
                    setFormState({ 
                      ...formState, 
                      invoice_date: newInvDate,
                      due_date: calculateDueDate(newInvDate, formState.term)
                    });
                  }}
                />
              </div>

              {/* Row 2 - Col 3: Created By */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Created By</label>
                <input 
                  type="text"
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 text-sm cursor-not-allowed"
                  value={formState.created_by}
                />
              </div>

              {/* Row 2 - Col 4: Control Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Control Number</label>
                <input 
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 transition-all"
                  placeholder="e.g. 1993"
                  value={formState.control_number}
                  onChange={(e) => setFormState({ ...formState, control_number: e.target.value })}
                />
              </div>

              {/* Row 3 - Col 1: Vendor * */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Vendor *</label>
                <input 
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 transition-all"
                  placeholder="e.g. MARK JOSEPH Q. REALUYO"
                  value={formState.vendor}
                  onChange={(e) => setFormState({ ...formState, vendor: e.target.value })}
                />
              </div>

              {/* Row 3 - Col 2: Term */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Term</label>
                <select 
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={formState.term}
                  onChange={(e) => {
                    const newTerm = e.target.value;
                    setFormState({ 
                      ...formState, 
                      term: newTerm,
                      due_date: calculateDueDate(formState.invoice_date, newTerm)
                    });
                  }}
                >
                  <option value="Net 30">Net 30</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                  <option value="COD">COD</option>
                  <option value="Immediate">Immediate</option>
                </select>
              </div>

              {/* Row 3 - Col 3: Due Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Due Date</label>
                <input 
                  type="date"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={formState.due_date}
                  onChange={(e) => setFormState({ ...formState, due_date: e.target.value })}
                />
              </div>

              {/* Row 3 - Col 4: Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Status</label>
                <input 
                  type="text"
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 text-sm cursor-not-allowed"
                  value={formState.status}
                />
              </div>
            </div>

            {/* MIDDLE ROW: Description & Bank to use for check */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Description</label>
                <input 
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 transition-all"
                  placeholder="e.g. RAW MATERIALS"
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Bank to use for check *</label>
                <select 
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={formState.bank_to_use}
                  onChange={(e) => setFormState({ ...formState, bank_to_use: e.target.value })}
                >
                  <option value="">Select Bank Account...</option>
                  {BANK_ACCOUNTS.map(acc => (
                    <option key={acc.value} value={acc.value}>{acc.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ITEMIZED TABLE */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse min-w-[760px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                    <tr>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 w-60">Expense Category</th>
                      <th className="py-3 px-4 w-28 text-center">Quantity</th>
                      <th className="py-3 px-4 w-36 text-center">Cost</th>
                      <th className="py-3 px-4 w-36 text-center">Subtotal</th>
                      <th className="py-3 px-4 w-24 text-right">
                        <button 
                          type="button" 
                          onClick={addItemRow}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                        >
                          Add
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {formState.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <input 
                            type="text"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400"
                            placeholder="e.g. RAW MATERIALS"
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          />
                        </td>
                        <td className="p-3">
                          <select 
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            value={item.expense_category}
                            onChange={(e) => handleItemChange(item.id, 'expense_category', e.target.value)}
                          >
                            {EXPENSE_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <input 
                            type="number"
                            min="1"
                            step="1"
                            className="w-full px-2 py-2 text-center bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 text-right bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="0.00"
                            value={item.cost || ''}
                            onChange={(e) => handleItemChange(item.id, 'cost', e.target.value)}
                          />
                        </td>
                        <td className="p-3">
                          <div className="w-full px-3 py-2 text-right font-mono font-bold text-sm text-slate-900 bg-slate-50 rounded-lg border border-slate-200">
                            {parseFloat(item.subtotal || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button 
                            type="button" 
                            onClick={() => removeItemRow(item.id)}
                            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BOTTOM SECTION: Comments + Files (Left) & Summary (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
              {/* Left (8 cols): Comments and Files */}
              <div className="lg:col-span-8 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Comments</label>
                  <textarea 
                    rows="3"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg font-mono text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 uppercase"
                    placeholder="NKB MANUFACTURING CORPORATION CHECK DETAILS..."
                    value={formState.comments}
                    onChange={(e) => setFormState({ ...formState, comments: e.target.value })}
                  ></textarea>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Files</label>
                  <div className="p-3 border border-slate-300 rounded-lg bg-white">
                    <input 
                      type="file"
                      multiple
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                      onChange={(e) => setFormState({ ...formState, attachments: e.target.files })}
                    />
                  </div>
                </div>
              </div>

              {/* Right (4 cols): Calculation Summary Card */}
              <div className="lg:col-span-4 border border-slate-200 rounded-xl p-6 bg-slate-50/50 shadow-sm space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-600 font-medium">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900">₱{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600 font-medium pt-3 border-t border-slate-200">
                  <span>Total:</span>
                  <span className="font-mono font-bold text-slate-900">₱{totalAmount.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
                  <span>Amount Due:</span>
                  <span className="font-mono text-xl text-blue-600">₱{amountDue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* FOOTER BUTTONS: Save (Blue) & Cancel (Red) */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <button 
                type="button" 
                onClick={() => setViewMode('list')}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save & Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Cheque Payables & Requisitions</h1>
          <p className="text-slate-500 font-medium mt-1">Manage supplier payable requests, approval relays, COO authorizations, and cheque disbursements.</p>
        </div>
        <button 
          onClick={() => setViewMode('create')}
          className="btn-erp btn-erp-primary flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>Payable Request Form</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="erp-card bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Pending Approval</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-4">{pendingCount}</p>
          <p className="text-xs text-slate-400 font-bold mt-1">Awaiting review & COO clearing</p>
        </div>

        <div className="erp-card bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">COO Confirmed</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-4">{confirmedCount}</p>
          <p className="text-xs text-slate-400 font-bold mt-1">Authorized for cheque release</p>
        </div>

        <div className="erp-card bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Cheques Issued</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-4">{issuedCount}</p>
          <p className="text-xs text-slate-400 font-bold mt-1">Pending bank clearing</p>
        </div>

        <div className="erp-card bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Outstanding</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-erp-blue flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-4">₱{totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-400 font-bold mt-1">Payable obligations in process</p>
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
              placeholder="Search by Payable #, Vendor, Invoice #, Control #..."
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
              <option value="Submitted For Approval">Submitted For Approval</option>
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
              <option value="">All Cost Centers</option>
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
                <th className="py-4 px-6">Payable #</th>
                <th className="py-4 px-6">Company / Entity</th>
                <th className="py-4 px-6">Vendor / Payee</th>
                <th className="py-4 px-6">Invoice #</th>
                <th className="py-4 px-6">Due Date</th>
                <th className="py-4 px-6">Amount Due</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-400">
                    <div className="w-8 h-8 border-4 border-erp-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs font-bold uppercase tracking-wider">Loading Payables Ledger...</p>
                  </td>
                </tr>
              ) : payables.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-400">
                    <FileText size={40} className="mx-auto mb-3 text-slate-300 stroke-1" />
                    <p className="text-base font-bold text-slate-700">No Payable Requests Found</p>
                    <p className="text-xs text-slate-400 mt-1">Create a new payable request form or adjust your search filters.</p>
                  </td>
                </tr>
              ) : (
                payables.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono font-black text-slate-900">{p.requisition_no}</span>
                      <p className="text-[11px] text-slate-400">{p.invoice_date || new Date(p.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-800 text-xs">{p.company || 'NKB Manufacturing Corporation'}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{p.supplier_name}</td>
                    <td className="py-4 px-6 text-slate-600 font-mono text-xs">{p.invoice_no || '—'}</td>
                    <td className="py-4 px-6 text-slate-600 text-xs font-bold">{p.due_date || '—'}</td>
                    <td className="py-4 px-6 font-mono font-black text-slate-900">₱{parseFloat(p.gross_amount || p.net_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
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
                        {['Submitted For Approval', 'Pending Approval'].includes(p.status) && isManager && (
                          <button 
                            onClick={() => handleApprove(p.id)}
                            title="Approve Requisition"
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-colors"
                          >
                            <Check size={18} />
                          </button>
                        )}

                        {/* COO Confirmation */}
                        {['Approved', 'Submitted For Approval', 'Pending Approval'].includes(p.status) && isCOOorAdmin && (
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
                        {['Submitted For Approval', 'Pending Approval', 'Approved'].includes(p.status) && (
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



      {/* ========================================================================= */}
      {/* DETAILS MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showDetailModal && selectedPayable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-3xl w-full border border-slate-200 shadow-2xl space-y-6 my-8"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-slate-900">{selectedPayable.requisition_no}</h3>
                    {getStatusBadge(selectedPayable.status)}
                  </div>
                  <p className="text-xs text-slate-400 font-bold mt-1">Company: {selectedPayable.company || 'NKB Manufacturing Corporation'} | Created by {selectedPayable.requestor_name || 'System'}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-slate-600">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Vendor</p>
                  <p className="text-sm font-black text-slate-900 mt-1">{selectedPayable.supplier_name}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Invoice #</p>
                  <p className="text-sm font-mono font-bold text-slate-900 mt-1">{selectedPayable.invoice_no || 'N/A'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Control #</p>
                  <p className="text-sm font-mono font-bold text-slate-900 mt-1">{selectedPayable.control_number || '—'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Amount Due</p>
                  <p className="text-sm font-mono font-black text-blue-600 mt-1">₱{parseFloat(selectedPayable.gross_amount || selectedPayable.net_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Bank Account */}
              {selectedPayable.bank_account && (
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-slate-700">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-1">Target Bank Account for Cheque</p>
                  <p className="font-bold">{selectedPayable.bank_account}</p>
                </div>
              )}

              {/* Line items if any */}
              {selectedPayable.items && selectedPayable.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itemized Breakdown</p>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Description</th>
                          <th className="p-3">Category</th>
                          <th className="p-3 text-center">Qty</th>
                          <th className="p-3 text-right">Cost</th>
                          <th className="p-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPayable.items.map((it, i) => (
                          <tr key={i}>
                            <td className="p-3 font-medium text-slate-900">{it.description}</td>
                            <td className="p-3 text-slate-600">{it.expense_category}</td>
                            <td className="p-3 text-center font-bold">{it.quantity}</td>
                            <td className="p-3 text-right font-mono">₱{parseFloat(it.cost).toFixed(2)}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">₱{parseFloat(it.subtotal).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              {selectedPayable.attachments && selectedPayable.attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attached Files</p>
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
                {['Submitted For Approval', 'Pending Approval'].includes(selectedPayable.status) && isManager && (
                  <button onClick={() => handleApprove(selectedPayable.id)} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700">
                    Approve
                  </button>
                )}

                {['Submitted For Approval', 'Pending Approval', 'Approved'].includes(selectedPayable.status) && isManager && (
                  <button onClick={() => setShowRejectModal(true)} className="px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-100">
                    Reject
                  </button>
                )}

                {['Approved', 'Submitted For Approval', 'Pending Approval'].includes(selectedPayable.status) && isCOOorAdmin && (
                  <button onClick={() => handleCOOConfirm(selectedPayable.id)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700">
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

      {/* ========================================================================= */}
      {/* CHEQUE ISSUANCE MODAL */}
      {/* ========================================================================= */}
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
                  <X size={20} />
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
                    <option value="BDO: NKB Manufacturing Corporation - 0080-5801-0547">BDO: NKB Manufacturing Corporation - 0080-5801-0547</option>
                    <option value="BDO: Norvin Bella (COOP) - 0080-5801-0563">BDO: Norvin Bella (COOP) - 0080-5801-0563</option>
                    <option value="BDO: NKB Cosmetics Manufacturing - 0105-4800-4829">BDO: NKB Cosmetics Manufacturing - 0105-4800-4829</option>
                    <option value="BDO: NKB Cosmetic Products Trading - 0105-4800-3245">BDO: NKB Cosmetic Products Trading - 0105-4800-3245</option>
                    <option value="BDO: New Yra Enterprises - 0036-8801-3196">BDO: New Yra Enterprises - 0036-8801-3196</option>
                    <option value="BDO: Vyuceutical - 0080-5801-0717">BDO: Vyuceutical - 0080-5801-0717</option>
                    <option value="Security Bank: NKB Manufacturing Corporation - 0000079720871">Security Bank: NKB Manufacturing Corporation - 0000079720871</option>
                    <option value="Metrobank: NKB Manufacturing Corporation - 788-7-78803245-1">Metrobank: NKB Manufacturing Corporation - 788-7-78803245-1</option>
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

      {/* ========================================================================= */}
      {/* REJECTION REASON MODAL */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* APPROVAL RELAY MODAL */}
      {/* ========================================================================= */}
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
                  <X size={20} />
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
