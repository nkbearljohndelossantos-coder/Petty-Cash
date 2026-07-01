import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Trash2, 
  Edit2, 
  StickyNote, 
  Calendar, 
  Search 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('pettyCashNotes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pettyCashNotes', JSON.stringify(notes));
  }, [notes]);

  const handleOpenModal = (note = null) => {
    setEditingNote(note);
    setFormData(note ? { title: note.title, description: note.description } : { title: '', description: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setFormData({ title: '', description: '' });
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingNote) {
      setNotes(notes.map(note => 
        note.id === editingNote.id 
          ? { ...note, ...formData, updatedAt: new Date().toISOString() }
          : note
      ));
    } else {
      setNotes([
        ...notes,
        {
          id: Date.now(),
          title: formData.title,
          description: formData.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    }
    handleCloseModal();
  };

  const handleDeleteNote = (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      setNotes(notes.filter(note => note.id !== id));
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort notes by most recently updated first
  const sortedNotes = [...filteredNotes].sort((a, b) =>
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  return (
    <div className="space-y-8 fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notes</h1>
          <p className="text-slate-500 font-medium mt-1">Keep track of important reminders and information.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2 w-80 focus-within:ring-2 focus-within:ring-erp-blue/20 transition-all">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm text-slate-900 w-full placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-erp-blue text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      {sortedNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-6">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
            <StickyNote size={48} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-700">No notes yet</h3>
            <p className="text-slate-500 mt-2 font-medium text-sm">Create your first note to get started.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedNotes.map(note => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="erp-card bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight line-clamp-2">{note.title}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenModal(note)}
                      className="p-2 text-slate-400 hover:text-erp-blue hover:bg-erp-blue/10 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600 line-clamp-6 leading-relaxed">{note.description}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {format(new Date(note.updatedAt), 'MMM d, yyyy')}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-slate-900/60 z-[999] backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] w-full max-w-lg"
            >
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingNote ? 'Edit Note' : 'Add New Note'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSaveNote} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider text-[10px]">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter note title..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-erp-blue/20 focus:border-erp-blue outline-none"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider text-[10px]">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Write your note here..."
                      rows={6}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-erp-blue/20 focus:border-erp-blue outline-none resize-none"
                    />
                  </div>
                  <div className="pt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-erp-blue text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                    >
                      Save Note
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notes;
