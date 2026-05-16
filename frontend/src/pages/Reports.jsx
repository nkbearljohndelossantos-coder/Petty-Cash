import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FileSpreadsheet, Activity, Filter, TrendingUp, FileText, ArrowRight, BarChart3, PieChart
} from 'lucide-react';
import { 
  BarChart as ReBarChart, Bar as ReBar, XAxis as ReXAxis, YAxis as ReYAxis, 
  CartesianGrid as ReCartesianGrid, Tooltip as ReTooltip, ResponsiveContainer as ReResponsiveContainer,
  PieChart as RPieChart, Pie as RPie, Cell as RCell, Legend as RLegend
} from 'recharts';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const Reports = () => {
  const reportRef = React.useRef(null);
  const [filters, setFilters] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    categoryId: '',
    departmentId: ''
  });
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      const [catRes, deptRes] = await Promise.all([
        api.get('/categories'),
        api.get('/departments')
      ]);
      setCategories(catRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/summary', { params: filters });
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#2563eb', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#475569', '#6366f1'];

  const handleExport = async () => {
    try {
      const blob = await api.get('/reports/export-excel', { 
        params: filters,
        responseType: 'blob' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NKB_Report_${filters.startDate}_to_${filters.endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Export failed. Please ensure you have data for the selected period.');
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setLoading(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`NKB_Financial_Report_${filters.startDate}_to_${filters.endDate}.pdf`);
    } catch (err) {
      console.error('PDF Export failed:', err);
      alert('PDF generation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 fade-in pb-20" ref={reportRef}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Audit & Reporting</h1>
          <p className="text-slate-500 font-medium mt-1">Generate enterprise-grade financial statements and audit logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportPDF} className="px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
            <FileText size={20} className="inline mr-2" />
            <span>Export Visual PDF</span>
          </button>
          <button onClick={handleExport} className="px-8 py-3 bg-erp-blue text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition-all">
            <FileSpreadsheet size={20} className="inline mr-2" />
            <span>Generate Excel Ledger</span>
          </button>
        </div>
      </div>

      {/* Filter Matrix */}
      <div className="erp-card p-8 bg-white border border-slate-200 shadow-sm">
         <div className="flex items-center gap-2 mb-8">
            <Filter size={18} className="text-erp-blue" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Reporting Parameters</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Start Period</label>
               <input 
                 type="date" 
                 className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900"
                 value={filters.startDate}
                 onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
               />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">End Period</label>
               <input 
                 type="date" 
                 className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900"
                 value={filters.endDate}
                 onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
               />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Focus Category</label>
               <select 
                 className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900"
                 value={filters.categoryId}
                 onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
               >
                  <option value="">All Categories</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
               </select>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department Scope</label>
               <select 
                 className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900"
                 value={filters.departmentId}
                 onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
               >
                  <option value="">Entire Enterprise</option>
                  {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
               </select>
            </div>
         </div>
      </div>

      {/* Summary Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <motion.div 
           whileHover={{ y: -5 }}
           className="erp-card p-8 bg-white border border-slate-200 shadow-sm border-l-8 border-l-erp-blue"
         >
            <div className="flex items-center justify-between mb-6">
               <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-erp-blue">
                  <TrendingUp size={24} />
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Spend</span>
            </div>
            <h4 className="text-4xl font-black text-slate-900 tracking-tighter">
               ₱{parseFloat(summary?.total_spent || 0).toLocaleString()}
            </h4>
            <p className="text-slate-500 text-xs font-bold mt-2 italic">Total approved expenditure for selected period</p>
         </motion.div>

         <motion.div 
           whileHover={{ y: -5 }}
           className="erp-card p-8 bg-white border border-slate-200 shadow-sm border-l-8 border-l-indigo-500"
         >
            <div className="flex items-center justify-between mb-6">
               <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-indigo-500">
                  <FileText size={24} />
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Volume</span>
            </div>
            <h4 className="text-4xl font-black text-slate-900 tracking-tighter">
               {summary?.total_count || 0}
            </h4>
            <p className="text-slate-500 text-xs font-bold mt-2 italic">Total voucher count within parameters</p>
         </motion.div>

         <motion.div 
           className="erp-card p-8 bg-white border border-slate-200 shadow-sm relative overflow-hidden group"
         >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Activity size={120} />
            </div>
            <h4 className="text-xl font-black text-slate-900 tracking-tight mb-4">Quick Audit Insights</h4>
            <div className="space-y-4">
               {summary?.categorySummary?.slice(0, 3).map((cat, i) => (
                  <div key={i} className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat.name}</span>
                     <span className="text-sm font-black text-slate-900">₱{parseFloat(cat.total).toLocaleString()}</span>
                  </div>
               ))}
            </div>
            <button onClick={handleExport} className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-erp-blue hover:underline transition-all">
               <span>Full Forensic Breakdown</span>
               <ArrowRight size={14} />
            </button>
         </motion.div>
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Category Breakdown Chart */}
         <div className="erp-card p-10 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-widest">Category Distribution</h3>
               <BarChart3 size={20} className="text-slate-300" />
            </div>
            <div className="h-[350px]">
               <ReResponsiveContainer width="100%" height="100%" minHeight={350}>
                  <ReBarChart data={summary?.categorySummary || []}>
                     <ReCartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                     <ReXAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                     <ReYAxis hide />
                     <ReTooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#fff', color: '#000', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                     />
                     <ReBar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </ReBarChart>
               </ReResponsiveContainer>
            </div>
         </div>

         {/* Insight Card with Mini-Pie */}
         <div className="erp-card p-10 bg-white border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-widest">Department Allocation</h3>
               <PieChart size={20} className="text-slate-300" />
            </div>
            <div className="flex-1 flex items-center justify-center relative">
               <div className="absolute flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Period Total</span>
                  <span className="text-xl font-black text-slate-900">₱{parseFloat(summary?.total_spent || 0).toLocaleString()}</span>
               </div>
               <ReResponsiveContainer width="100%" height={280} minHeight={280}>
                  <RPieChart>
                     <RPie
                        data={summary?.departmentSummary || []}
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="total"
                        nameKey="name"
                        stroke="none"
                     >
                        {(summary?.departmentSummary || []).map((entry, index) => (
                           <RCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </RPie>
                     <ReTooltip contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#fff', color: '#000', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                  </RPieChart>
               </ReResponsiveContainer>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
               {summary?.departmentSummary?.slice(0, 4).map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{d.name}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* Advanced Analysis Note */}
      <div className="erp-card p-8 bg-slate-50 border border-slate-200 flex items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
               <Activity size={24} />
            </div>
            <div>
               <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Dynamic Forensic Synchronization</h4>
               <p className="text-xs text-slate-500 font-medium">Charts automatically re-calculate based on the period and filters set above.</p>
            </div>
         </div>
         <button className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            View Analytics Detail
         </button>
      </div>
    </div>
  );
};

export default Reports;
