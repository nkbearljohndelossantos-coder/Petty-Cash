import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Check, 
  X,
  FileSpreadsheet,
  FileIcon as FilePdf,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  History,
  FileText,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { exportExpensesToPDF } from '../utils/exportUtils';
import { useAuth } from '../context/AuthContext';

const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState(['Box', 'Ream', 'Piece', 'Kilogram', 'Drums', 'Container', 'Gallon', 'Bag', 'Pouches', 'Bottle']);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    category: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10 });

  // Form State
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    category_id: '',
    remarks: '',
    requested_by: '',
    department_id: '',
    amount: '',
    quantity: 1,
    unit: 'Piece',
    status: 'Pending'
  });
  const [files, setFiles] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const filtersRef = useRef(filters);
  const fetchAbortRef = useRef(null);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => (prev.search === searchInput ? prev : { ...prev, search: searchInput, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = useCallback(async (showSpinner = true) => {
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    if (showSpinner) setLoading(true);
    try {
      const res = await api.get('/expenses', {
        params: filtersRef.current,
        signal: controller.signal
      });
      if (controller.signal.aborted) return;

      const nextExpenses = res.data || res || [];
      const nextPagination = res.pagination || { total: 0, page: 1, limit: 10 };

      setExpenses(prev => {
        const prevKey = prev.map(e => `${e.id}:${e.status}:${e.amount}`).join('|');
        const nextKey = nextExpenses.map(e => `${e.id}:${e.status}:${e.amount}`).join('|');
        return prevKey === nextKey ? prev : nextExpenses;
      });
      setPagination(prev => {
        if (prev.total === nextPagination.total && prev.page === nextPagination.page && prev.limit === nextPagination.limit) {
          return prev;
        }
        return nextPagination;
      });
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED' || err?.message === 'canceled') return;
      console.error('Fetch Expenses Error:', err);
      if (showSpinner) setExpenses([]);
    } finally {
      if (!controller.signal.aborted && showSpinner) setLoading(false);
    }
  }, []);

  const fetchMetadata = async () => {
    try {
      const [catRes, deptRes, settingsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/departments'),
        api.get('/settings')
      ]);
      setCategories(catRes.data || catRes || []);
      setDepartments(deptRes.data || deptRes || []);
      const settings = settingsRes.data || settingsRes || {};
      if (settings.expense_units) {
        try {
          const parsed = JSON.parse(settings.expense_units);
          if (Array.isArray(parsed) && parsed.length) setUnits(parsed);
        } catch (_) { /* keep defaults */ }
      }
    } catch (err) {
      console.error('Fetch Metadata Error:', err);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    files.forEach(file => data.append('attachments', file));

    try {
      await api.post('/expenses', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowAddModal(false);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        category_id: '',
        remarks: '',
        requested_by: '',
        department_id: '',
        amount: '',
        quantity: 1,
        unit: 'Piece',
        status: 'Pending'
      });
      setFiles([]);
      fetchData(true);
    } catch (err) {
      alert(err.message);
    }
  };
  
  const handleView = async (id) => {
    console.log('Viewing expense ID:', id);
    try {
      const res = await api.get(`/expenses/${id}`);
      console.log('View Data:', res.data);
      setSelectedExpense(res.data);
      setShowViewModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch details');
    }
  };

  const handleEdit = (expense) => {
    console.log('Editing expense:', expense);
    setSelectedExpense(expense);
    setFormData({
      date: format(new Date(expense.date), 'yyyy-MM-dd'),
      category_id: expense.category_id || '',
      remarks: expense.remarks || '',
      requested_by: expense.requested_by || '',
      department_id: expense.department_id || '',
      amount: expense.amount || '',
      quantity: expense.quantity || 1,
      unit: expense.unit || 'Piece',
      status: expense.status || 'Pending'
    });
    setShowEditModal(true);
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/expenses/${selectedExpense.id}`, formData);
      setShowEditModal(false);
      fetchData(true);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/expenses/${id}/status`, { status });
      fetchData(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExportPDF = () => {
    exportExpensesToPDF(expenses, filters);
  };

  const handleExportExcel = async () => {
    try {
      const blob = await api.get('/reports/export-excel', { 
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NKB_Expenses_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Excel export failed');
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Approved': return 'status-approved';
      case 'Pending': return 'status-pending';
      case 'Rejected': return 'status-rejected';
      case 'Liquidated': return 'status-liquidated';
      default: return '';
    }
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Expense Monitoring</h1>
          <p className="text-slate-500 font-medium mt-1">Audit and manage all manufacturing expenditures.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
             <button onClick={handleExportExcel} className="p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Export Excel">
                <FileSpreadsheet size={20} />
             </button>
             <button onClick={handleExportPDF} className="p-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Export PDF">
                <FilePdf size={20} />
             </button>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-erp btn-erp-primary"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span>New Expense</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="erp-card p-6 bg-white shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search PCV, remarks..." 
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-erp-blue/20 outline-none transition-all text-sm font-medium text-slate-900"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <select 
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-erp-blue/20 outline-none transition-all text-sm font-bold text-slate-600"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
            >
              <option value="">All Categories</option>
              {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select 
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-erp-blue/20 outline-none transition-all text-sm font-bold text-slate-600"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Liquidated">Liquidated</option>
            </select>
          </div>
          <div className="lg:col-span-2 flex items-center gap-4">
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl">
               <Calendar size={16} className="text-slate-400" />
               <input 
                 type="date" 
                 className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 w-full"
                 value={filters.startDate}
                 onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
               />
               <span className="text-slate-300 font-black">/</span>
               <input 
                 type="date" 
                 className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 w-full"
                 value={filters.endDate}
                 onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
               />
            </div>
            <button 
              onClick={() => { setSearchInput(''); setFilters({ ...filters, page: 1, search: '', category: '', status: '', startDate: '', endDate: '' }); }}
              className="p-3 text-slate-400 hover:text-erp-blue hover:bg-erp-blue/5 rounded-2xl transition-all"
              title="Reset Filters"
            >
              <History size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="erp-card overflow-hidden bg-white border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-white">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100">
                   <div className="flex items-center gap-2">Date <ArrowUpDown size={12} /></div>
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100">Requester Details</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100">Category & Items</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 text-center">Qty / Unit</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Amount</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <div className="w-10 h-10 border-4 border-erp-blue border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching Ledger Data...</p>
                    </div>
                  </td>
                </tr>
              ) : (expenses || []).length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No records found</td>
                </tr>
              ) : (
                (expenses || []).map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-slate-900 tracking-tight">
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Ref: PCV-{expense.id.toString().padStart(4, '0')}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-600 font-black text-xs uppercase tracking-tighter shadow-sm border border-slate-200">
                           {expense.requested_by.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 leading-tight tracking-tight">{expense.requested_by}</div>
                          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">{expense.department_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 max-w-xs">
                      <span className={`status-badge ${getStatusClass(expense.status)} text-[10px]`}>{expense.category_name}</span>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-1 font-medium">{expense.remarks || 'No remarks provided.'}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <div className="text-sm font-black text-slate-900">{expense.quantity}</div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{expense.unit}</div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="text-base font-black text-slate-900 tracking-tight">
                        ₱{parseFloat(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className={`status-badge inline-block ${getStatusClass(expense.status)}`}>
                         {expense.status}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        {(user?.role === 'Super Admin' || user?.role === 'Manager' || user?.role === 'Accounting') && expense.status === 'Pending' && (
                          <>
                            <button 
                              onClick={() => handleStatusUpdate(expense.id, 'Approved')}
                              className="p-2.5 hover:bg-emerald-500 hover:text-white rounded-xl text-emerald-500 transition-all shadow-sm bg-white border border-emerald-100" 
                              title="Approve Request"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(expense.id, 'Rejected')}
                              className="p-2.5 hover:bg-rose-500 hover:text-white rounded-xl text-rose-500 transition-all shadow-sm bg-white border border-rose-100" 
                              title="Reject Request"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        {(user?.role === 'Super Admin' || user?.role === 'Accounting') && expense.status === 'Approved' && (
                          <button 
                            onClick={() => handleStatusUpdate(expense.id, 'Liquidated')}
                            className="p-2.5 hover:bg-erp-blue hover:text-white rounded-xl text-erp-blue transition-all shadow-sm bg-white border border-blue-100" 
                            title="Liquidate Expense"
                          >
                            <History size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleView(expense.id)}
                          className="p-2.5 hover:bg-erp-blue hover:text-white rounded-xl text-slate-400 transition-all shadow-sm bg-white border border-slate-200" 
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleEdit(expense)}
                          className="p-2.5 hover:bg-erp-blue hover:text-white rounded-xl text-slate-400 transition-all shadow-sm bg-white border border-slate-200" 
                          title="Edit Record"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border-t border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Showing <span className="text-slate-900">{(filters.page - 1) * filters.limit + 1} - {Math.min(filters.page * filters.limit, pagination.total)}</span> of <span className="text-slate-900">{pagination.total}</span> Expense Records
          </p>
          <div className="flex items-center gap-3">
            <button 
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              className="p-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
               {Array.from({ length: Math.ceil(pagination.total / filters.limit) }).map((_, i) => (
                 <button 
                   key={i}
                   onClick={() => setFilters({ ...filters, page: i + 1 })}
                   className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${filters.page === i + 1 ? 'bg-erp-blue text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                 >
                   {i + 1}
                 </button>
               )).slice(0, 5)}
            </div>
            <button 
              disabled={filters.page * filters.limit >= pagination.total}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              className="p-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-200"
            >
              <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Expenditure Request</h2>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Petty Cash Voucher Entry</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-slate-900 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddExpense} className="p-10 space-y-8">
                <div className="flex items-center gap-4 bg-white border border-slate-100 px-4 py-2 rounded-xl">
                  <Activity size={16} className="text-erp-blue" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Performance Matrix</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Voucher Date</label>
                    <input 
                      type="date" 
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-erp-blue/10 outline-none transition-all font-bold text-slate-800" 
                      required 
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Expense Category</label>
                    <select 
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-erp-blue/10 outline-none transition-all font-bold text-slate-800" 
                      required
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Requester Full Name</label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-erp-blue/10 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300" 
                      required 
                      placeholder="e.g. Juan Dela Cruz"
                      value={formData.requested_by}
                      onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Cost Center (Dept)</label>
                    <select 
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-erp-blue/10 outline-none transition-all font-bold text-slate-800" 
                      required
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {(departments || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Quantity</label>
                    <input 
                      type="number" min="1"
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-erp-blue/10 outline-none transition-all font-bold text-slate-800" 
                      required 
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Unit of Measure</label>
                    <select 
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-erp-blue/10 outline-none transition-all font-bold text-slate-800" 
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      {units.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Total Amount (PHP)</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">₱</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="w-full pl-10 pr-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-erp-blue/10 outline-none transition-all font-black text-slate-900 text-lg" 
                        required 
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Status</label>
                    <select 
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-erp-blue/10 outline-none transition-all font-bold text-slate-800" 
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Pending">Pending Verification</option>
                      <option value="Approved">Direct Approval</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Detailed Remarks</label>
                  <textarea 
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-erp-blue/10 outline-none transition-all font-medium text-slate-800 h-28 resize-none" 
                    placeholder="Enter justification or item details..."
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex-1">Discard Change</button>
                  <button type="submit" className="px-8 py-4 bg-erp-blue text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition-all flex-1">Commit Voucher</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* View Modal */}
      <AnimatePresence>
        {showViewModal && selectedExpense && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowViewModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Voucher Details</h2>
                  <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors"><X size={20} /></button>
               </div>
               <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requester</p>
                        <p className="text-lg font-bold text-slate-900">{selectedExpense.requested_by}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
                        <p className="text-lg font-black text-erp-blue">₱{parseFloat(selectedExpense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                     </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Remarks / Justification</p>
                     <p className="text-sm font-medium text-slate-700 leading-relaxed">{selectedExpense.remarks || 'No remarks.'}</p>
                  </div>
                  {selectedExpense.attachments && selectedExpense.attachments.length > 0 && (
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Attachments ({selectedExpense.attachments.length})</p>
                       <div className="grid grid-cols-2 gap-3">
                          {selectedExpense.attachments.map((file, i) => (
                             <a key={i} href={`${import.meta.env.VITE_API_URL || ''}/${file.file_path.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-erp-blue transition-colors group">
                                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-erp-blue"><FileText size={16} /></div>
                                <span className="text-[10px] font-bold text-slate-600 truncate">{file.file_name}</span>
                             </a>
                          ))}
                       </div>
                    </div>
                  )}
               </div>
               <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button onClick={() => setShowViewModal(false)} className="px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest">Close Preview</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal (Reusing Add Modal Structure) */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900">Edit Expense Record</h2>
                  <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} /></button>
               </div>
               <form onSubmit={handleUpdateExpense} className="p-8 space-y-6">
                  {/* Reuse fields from Add Modal but mapped to handleUpdateExpense */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Voucher Date</label>
                      <input type="date" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                      <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} required>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Requester</label>
                      <input type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold" value={formData.requested_by} onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Amount</label>
                      <input type="number" step="0.01" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-black text-erp-blue" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Remarks</label>
                    <textarea className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium h-24" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 px-8 py-4 bg-erp-blue text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/30">
                      {isSubmitting ? 'Updating...' : 'Save Changes'}
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

export default Expenses;
