import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  History, 
  Search, 
  Filter, 
  User, 
  Clock, 
  Globe, 
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/logs');
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = (logs || []).filter(log => 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action) => {
    if (action.includes('LOGIN')) return 'bg-white text-blue-700 border-blue-200';
    if (action.includes('CREATE')) return 'bg-white text-emerald-700 border-emerald-200';
    if (action.includes('UPDATE') || action.includes('APPROVE')) return 'bg-white text-amber-700 border-amber-200';
    if (action.includes('DELETE') || action.includes('REJECT')) return 'bg-white text-rose-700 border-rose-200';
    return 'bg-white text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-8 fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Audit Trail</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time forensic activity logs and security tracking.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl">
              <History size={16} className="text-erp-blue" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-600">{logs.length} Total Events</span>
           </div>
        </div>
      </div>

      <div className="erp-card bg-white overflow-hidden border border-slate-200 shadow-sm">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search actions, users, or details..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-erp-blue/10 transition-all text-sm font-medium text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
             <button className="flex items-center gap-2 px-5 py-3 bg-white text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all">
                <Calendar size={16} />
                <span>Range</span>
             </button>
             <button className="flex items-center gap-2 px-5 py-3 bg-white text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all">
                <Filter size={16} />
                <span>Filters</span>
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-white">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100">Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100">User</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 text-center">Action</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100">Details</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                     <div className="inline-block w-8 h-8 border-4 border-erp-blue border-t-transparent rounded-full animate-spin"></div>
                     <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Audit Data...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                     <div className="flex flex-col items-center opacity-40">
                        <AlertCircle size={48} className="text-slate-300 mb-4" />
                        <p className="text-sm font-bold text-slate-500">No activity logs found matching your criteria</p>
                     </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <motion.tr 
                    key={log.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white border border-slate-100 rounded-xl text-slate-500">
                           <Clock size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 tracking-tight">
                            {format(new Date(log.created_at), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                            {format(new Date(log.created_at), 'HH:mm:ss')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-slate-500 font-black text-xs border border-slate-200">
                           {log.full_name?.[0] || 'S'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 tracking-tight">{log.full_name || 'System'}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{log.username || 'nkb_system'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="max-w-xs xl:max-w-md truncate text-sm font-medium text-slate-600" title={log.details}>
                        {log.details}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <Globe size={12} />
                         {log.ip_address || 'Internal'}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Logs;
