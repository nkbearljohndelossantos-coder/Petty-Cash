import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Plus, Search, Wallet, ArrowDownCircle, 
  History, Calendar, FileText, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const Funds = () => {
  const [funds, setFunds] = useState([]);
  const [balanceData, setBalanceData] = useState({ balance: 0, totalIn: 0, totalOut: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    reference_no: '',
    remarks: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fundsRes, balanceRes] = await Promise.all([
        api.get('/funds'),
        api.get('/funds/balance')
      ]);
      setFunds(fundsRes.data);
      setBalanceData(balanceRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/funds', formData);
      setShowAddModal(false);
      setFormData({ amount: '', reference_no: '', remarks: '', date: format(new Date(), 'yyyy-MM-dd') });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fund Management</h1>
          <p className="text-slate-500 font-medium mt-1">Track petty cash replenishments and overall liquidity.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-erp btn-erp-primary"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>Replenish Fund</span>
        </button>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="erp-card p-8 bg-gradient-to-br from-emerald-600 to-emerald-400 text-white shadow-lg shadow-emerald-600/20">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Available Liquidity</p>
            <h2 className="text-4xl font-black mt-2">₱{balanceData.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1 rounded-full">
               <CheckCircle size={14} />
               <span>System Verified</span>
            </div>
         </div>
         <div className="erp-card p-8 bg-white border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Cash Inflow</p>
            <h2 className="text-3xl font-black text-slate-800 mt-2">₱{balanceData.totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
            <p className="text-[10px] text-emerald-500 font-bold mt-2 uppercase">From all replenishments</p>
         </div>
         <div className="erp-card p-8 bg-white border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Expenditures</p>
            <h2 className="text-3xl font-black text-rose-600 mt-2">₱{balanceData.totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">Approved & Liquidated</p>
         </div>
      </div>

      {/* Fund History */}
      <div className="erp-card overflow-hidden bg-white border border-slate-200 shadow-sm">
         <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Replenishment History</h3>
            <div className="flex items-center gap-2 text-slate-400">
               <History size={18} />
               <span className="text-xs font-bold uppercase tracking-widest">Audit Log</span>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-white">
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Date</th>
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Reference No.</th>
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Remarks</th>
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Amount</th>
                     <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Added By</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {loading ? (
                     <tr><td colSpan="5" className="px-8 py-20 text-center text-slate-400">Loading fund logs...</td></tr>
                  ) : funds.map((f) => (
                     <tr key={f.id} className="hover:bg-slate-50 transition-all">
                        <td className="px-8 py-6 text-sm font-bold text-slate-600">{format(new Date(f.date), 'MMM dd, yyyy')}</td>
                        <td className="px-8 py-6 text-xs font-black text-erp-blue uppercase tracking-widest">{f.reference_no || 'N/A'}</td>
                        <td className="px-8 py-6 text-xs font-medium text-slate-500">{f.remarks || 'Standard replenishment'}</td>
                        <td className="px-8 py-6 text-right font-black text-emerald-600">₱{parseFloat(f.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-8 py-6 text-center">
                           <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-500 uppercase">{f.adder_name}</span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Add Fund Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 border border-slate-200"
             >
                <div className="mb-8">
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">Replenish Fund</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cash-In Transaction</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Amount to Add (PHP)</label>
                      <input type="number" step="0.01" required className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 font-black text-emerald-600 text-xl" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reference No.</label>
                      <input type="text" className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900" placeholder="Check # or OR #" value={formData.reference_no} onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Voucher Date</label>
                      <input type="date" required className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-erp-blue/10 font-bold text-slate-900" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex-1">Discard</button>
                      <button type="submit" className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition-all flex-1">Confirm Deposit</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Funds;
