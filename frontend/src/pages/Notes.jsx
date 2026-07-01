import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, Edit3, MoreHorizontal, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const menuRef = useRef(null);

  // Load notes from API on mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notes');
      setNotes(response.data || []);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleOpenViewModal = (note) => {
    setViewingNote(note);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModalFromView = () => {
    if (viewingNote) {
      setTitle(viewingNote.title);
      setDescription(viewingNote.description || '');
      setEditingNoteId(viewingNote.id);
      setIsViewMode(false);
    }
  };

  const handleOpenModal = (note = null) => {
    if (note) {
      setEditingNoteId(note.id);
      setTitle(note.title);
      setDescription(note.description || '');
    } else {
      setEditingNoteId(null);
      setTitle('');
      setDescription('');
    }
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsViewMode(false);
    setEditingNoteId(null);
    setViewingNote(null);
    setTitle('');
    setDescription('');
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSaving(true);
      if (editingNoteId) {
        // Update existing note
        await api.put(`/notes/${editingNoteId}`, { title, description });
      } else {
        // Create new note
        await api.post('/notes', { title, description });
      }
      await loadNotes();
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await api.delete(`/notes/${noteId}`);
        await loadNotes();
        setOpenMenuId(null);
      } catch (err) {
        console.error('Failed to delete note:', err);
      }
    }
  };

  const handleEditNote = (note) => {
    handleOpenModal(note);
    setOpenMenuId(null);
  };

  const toggleMenu = (noteId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === noteId ? null : noteId);
  };

  return (
    <div className="min-h-[calc(100vh-180px)] bg-white">
      <div className="py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-black tracking-tight drop-shadow-sm">Notes</h1>
            <p className="text-gray-700 font-medium mt-1">Keep track of important reminders and information.</p>
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {/* Add Note Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              whileHover={{ 
                scale: 1.03, 
                boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl p-5 h-[250px] flex flex-col justify-center items-center cursor-pointer border-2 border-dashed border-gray-300"
              onClick={() => handleOpenModal()}
            >
              <div className="w-[80px] h-[80px] rounded-full bg-gray-50 flex items-center justify-center border-2 border-gray-300">
                <Plus size={42} className="text-gray-500" />
              </div>
              <p className="mt-5 font-semibold text-gray-700">Add new note</p>
            </motion.div>

            {/* Notes List */}
            {notes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ 
                  scale: 1.03, 
                  boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-xl p-5 h-[250px] flex flex-col justify-between border border-gray-200 cursor-pointer"
                onClick={() => handleOpenViewModal(note)}
              >
                <div className="flex flex-col h-full justify-between">
                  <div className="details">
                    <p className="text-2xl font-bold text-gray-900 leading-snug line-clamp-2">{note.title}</p>
                    <span className="block mt-3 text-base text-gray-700 line-clamp-4 leading-relaxed">{note.description}</span>
                  </div>
                  <div className="bottom-content flex flex-row justify-between items-center pt-4 mt-4 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-500">{formatDate(note.updated_at)}</span>
                    <div className="settings relative" ref={note.id === openMenuId ? menuRef : null}>
                      <button
                        onClick={(e) => toggleMenu(note.id, e)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <MoreHorizontal size={20} />
                      </button>
                      <AnimatePresence>
                        {openMenuId === note.id && (
                          <motion.ul
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            className="menu absolute bottom-full mb-3 right-0 bg-white shadow-xl rounded-xl py-2 z-50 min-w-[140px]"
                            style={{
                              transformOrigin: 'bottom right'
                            }}
                          >
                            <li
                              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditNote(note);
                              }}
                            >
                              <Edit3 size={16} className="text-blue-500" />
                              Edit
                            </li>
                            <li
                              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 text-sm font-medium text-red-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNote(note.id);
                              }}
                            >
                              <Trash2 size={16} />
                              Delete
                            </li>
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence mode="wait">
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleCloseModal}
              className="popup-box fixed inset-0 z-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full px-4 ${isViewMode ? 'max-w-5xl' : 'max-w-2xl'}`}
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div className="border-b border-gray-200 flex justify-between items-center p-6 md:p-8">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {isViewMode ? viewingNote?.title : (editingNoteId ? 'Edit note' : 'Add a new note')}
                    </p>
                    {isViewMode && (
                      <p className="text-sm text-gray-500 mt-1">
                        Last updated: {formatDate(viewingNote?.updated_at)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-3 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                {/* View Mode */}
                {isViewMode && viewingNote && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 md:p-10"
                  >
                    <div className="space-y-6">
                      <div className="bg-gray-50 rounded-2xl p-8 min-h-[400px]">
                        <p className="text-lg text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {viewingNote.description || <span className="text-gray-400 italic">No description</span>}
                        </p>
                      </div>
                      <div className="flex gap-4 pt-2">
                        <button
                          onClick={handleOpenEditModalFromView}
                          className="flex-1 h-[56px] text-white text-base font-semibold rounded-xl cursor-pointer hover:opacity-90 transition-all hover:shadow-lg flex items-center justify-center gap-2"
                          style={{ backgroundColor: '#1f2937' }}
                        >
                          <Edit3 size={20} />
                          Edit Note
                        </button>
                        <button
                          onClick={handleCloseModal}
                          className="h-[56px] px-8 text-gray-700 text-base font-semibold rounded-xl cursor-pointer hover:bg-gray-100 transition-all border border-gray-200 bg-white"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Edit/Add Mode */}
                {!isViewMode && (
                  <motion.form 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleSaveNote} 
                    className="p-8 md:p-10 space-y-6"
                  >
                    <div className="row title">
                      <label className="block mb-3 text-sm font-bold text-gray-600 uppercase tracking-wide">Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter note title..."
                        className="w-full h-[56px] px-6 py-4 border border-gray-300 rounded-2xl text-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-medium"
                        autoFocus
                      />
                    </div>
                    <div className="row description">
                      <label className="block mb-3 text-sm font-bold text-gray-600 uppercase tracking-wide">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Write your note here..."
                        rows={10}
                        className="w-full min-h-[300px] px-6 py-4 border border-gray-300 rounded-2xl text-base outline-none resize-y focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                      />
                    </div>
                    <div className="flex gap-4 pt-2">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 h-[56px] text-white text-base font-semibold rounded-2xl cursor-pointer hover:opacity-90 transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#1f2937' }}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            {editingNoteId ? 'Updating...' : 'Adding...'}
                          </>
                        ) : (
                          editingNoteId ? 'Update Note' : 'Add Note'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="h-[56px] px-8 text-gray-700 text-base font-semibold rounded-2xl cursor-pointer hover:bg-gray-100 transition-all border border-gray-200 bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notes;