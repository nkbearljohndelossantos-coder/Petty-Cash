import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, Building2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentDept, setCurrentDept] = useState(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      setDepartments(res.data || res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentDept) {
        await api.put(`/departments/${currentDept.id}`, formData);
      } else {
        await api.post('/departments', formData);
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this cost center?')) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Cost Centers</h1>
          <p className="text-slate-500 font-medium mt-1">Manage NKB departments used in expense entries (Cost Center field).</p>
        </div>
        <button
          onClick={() => { setCurrentDept(null); setFormData({ name: '' }); setShowModal(true); }}
          className="btn-erp btn-erp-primary"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>Add Cost Center</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-400 text-xs font-black uppercase tracking-widest">Loading...</div>
        ) : departments.map((dept, i) => (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="erp-card p-6 bg-white border border-slate-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Building2 size={24} />
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setCurrentDept(dept); setFormData({ name: dept.name }); setShowModal(true); }} className="p-2 text-slate-400 hover:text-erp-blue rounded-xl"><Edit size={16} /></button>
                <button onClick={() => handleDelete(dept.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-xl"><Trash2 size={16} /></button>
              </div>
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase">{dept.name}</h3>
            {dept.created_at && (
              <p className="text-[10px] text-slate-400 font-bold mt-4 flex items-center gap-1">
                <History size={12} /> {new Date(dept.created_at).toLocaleDateString()}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-[2rem] p-10 border border-slate-200 shadow-2xl">
              <h2 className="text-2xl font-black text-slate-900">{currentDept ? 'Edit Cost Center' : 'New Cost Center'}</h2>
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl font-bold uppercase"
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    placeholder="e.g. PRODUCTION"
                  />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 border border-slate-200 rounded-2xl font-black text-xs uppercase">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-erp-blue text-white rounded-2xl font-black text-xs uppercase">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Departments;
