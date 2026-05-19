import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Plus, Search, Edit, Trash2, X, Check, 
  Layers, Tag, History, Info, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentCat, setCurrentCat] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentCat) {
        await api.put(`/categories/${currentCat.id}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (cat) => {
    setCurrentCat(cat);
    setFormData({ name: cat.name, description: cat.description || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Financial Classifications</h1>
          <p className="text-slate-500 font-medium mt-1">Define and organize expense categories for accurate reporting.</p>
        </div>
        <button 
          onClick={() => { setCurrentCat(null); setFormData({ name: '', description: '' }); setShowModal(true); }}
          className="btn-erp btn-erp-primary"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4 text-slate-400">
             <div className="w-10 h-10 border-4 border-erp-blue border-t-transparent rounded-full animate-spin"></div>
             <p className="text-xs font-black uppercase tracking-widest">Loading Schema...</p>
          </div>
        ) : categories.map((cat, i) => (
          <motion.div 
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="erp-card erp-card-hover p-6 group relative overflow-hidden bg-white border border-slate-200"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-erp-blue/5 rounded-bl-full -mr-10 -mt-10 group-hover:bg-erp-blue/10 transition-all duration-500"></div>
            
            <div className="flex items-start justify-between mb-6 relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-erp-blue group-hover:scale-110 transition-transform duration-500">
                  <Tag size={24} strokeWidth={2.5} />
               </div>
               <div className="flex gap-1">
                  <button onClick={() => handleEdit(cat)} className="p-2 text-slate-400 hover:text-erp-blue hover:bg-erp-blue/5 rounded-xl transition-all"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(cat.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
               </div>
            </div>

            <div className="space-y-1 relative z-10">
               <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">{cat.name}</h3>
               <p className="text-xs font-medium text-slate-500 line-clamp-2 min-h-[32px]">{cat.description || 'No specialized description provided for this classification.'}</p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Status</span>
               </div>
               <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <History size={12} />
                  Created {new Date(cat.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowModal(false)}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 p-10"
             >
                <div className="mb-8">
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">{currentCat ? 'Update Classification' : 'New Classification'}</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">System Schema Configuration</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Category Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-erp-blue/10 outline-none transition-all font-bold text-slate-800 uppercase"
                        placeholder="e.g. OFFICE SUPPLIES"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Business Context</label>
                      <textarea 
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-erp-blue/10 outline-none transition-all font-medium text-slate-800 h-32 resize-none"
                        placeholder="Define the scope of this category..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                   </div>
                   
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex-1">Cancel</button>
                      <button type="submit" className="px-8 py-4 bg-erp-blue text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition-all flex-1">Commit Changes</button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Categories;
