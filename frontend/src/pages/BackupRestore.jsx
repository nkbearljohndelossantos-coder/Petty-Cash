import React, { useState } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle2, ShieldCheck, Database, Loader2 } from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const BackupRestore = () => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [showConfirm, setShowConfirm] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const blob = await api.get('/backup/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NKB_System_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setStatus({ type: 'success', message: 'Backup exported successfully!' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to export backup. Access denied or server error.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleRestore = async () => {
    if (!file) return;
    
    setLoading(true);
    setShowConfirm(false);
    setStatus({ type: '', message: '' });

    const formData = new FormData();
    formData.append('backup', file);

    try {
      const data = await api.post('/backup/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus({ type: 'success', message: data.message });
      setFile(null);
    } catch (err) {
      console.error(err);
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Restore failed. Ensure the file is a valid NKB backup.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Maintenance</h1>
        <p className="text-slate-500 font-medium">Manage enterprise data backups and disaster recovery protocols.</p>
      </div>

      {status.message && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 border ${
            status.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
              : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}
        >
          {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span className="text-sm font-bold">{status.message}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Export Card */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="erp-card p-8 bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-erp-blue">
            <Download size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Export System Data</h3>
            <p className="text-sm text-slate-500 mt-2">Generate a comprehensive Excel backup of all records, users, and settings.</p>
          </div>
          <button 
            onClick={handleExport}
            disabled={loading}
            className="w-full py-4 bg-erp-blue text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />}
            <span>Download .xlsx Backup</span>
          </button>
        </motion.div>

        {/* Import Card */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="erp-card p-8 bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Upload size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Restore from Backup</h3>
            <p className="text-sm text-slate-500 mt-2">Recover data from a previous backup file. Note: This will overwrite current data.</p>
          </div>
          
          <div className="w-full space-y-4">
            <div className="relative group">
              <input 
                type="file" 
                accept=".xlsx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="py-3 px-4 border-2 border-dashed border-slate-200 group-hover:border-amber-400 rounded-xl transition-colors flex flex-col items-center gap-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {file ? file.name : 'Select Backup File'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setShowConfirm(true)}
              disabled={loading || !file}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
              <span>Initiate Restoration</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Warning Section */}
      <div className="erp-card p-8 bg-rose-50 border border-rose-100 flex flex-col md:flex-row items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-rose-500 shadow-sm">
          <AlertTriangle size={28} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-black text-rose-900 uppercase tracking-widest">Critical Protocol Warning</h4>
          <p className="text-xs text-rose-700 font-medium mt-1 leading-relaxed">
            Restoration is a destructive action. It clears all existing records in the database before populating them with backup data. Ensure you have exported a current backup before proceeding with any restoration.
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-amber-500" />
              <h3 className="text-xl font-black text-slate-900">Confirm Restoration?</h3>
              <p className="text-slate-500 text-sm mt-4 font-medium leading-relaxed">
                You are about to overwrite the entire system database with data from <strong>{file?.name}</strong>. This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRestore}
                  className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/30"
                >
                  Yes, Restore Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BackupRestore;
