// Notes Page with View Mode
import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, Edit3, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
  const [viewingNoteIndex, setViewingNoteIndex] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const menuRef = useRef(null);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenViewModal = (index) => {
    console.log('handleOpenViewModal called with index:', index);
    console.log('Current notes array:', notes);
    setViewingNoteIndex(index);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModalFromView = () => {
    if (viewingNoteIndex !== null) {
      setTitle(notes[viewingNoteIndex].title);
      setDescription(notes[viewingNoteIndex].description);
      setEditingNoteIndex(viewingNoteIndex);
      setIsViewMode(false);
    }
  };

  const handleOpenModal = (index = null) => {
    if (index !== null) {
      setEditingNoteIndex(index);
      setTitle(notes[index].title);
      setDescription(notes[index].description);
    } else {
      setEditingNoteIndex(null);
      setTitle('');
      setDescription('');
    }
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsViewMode(false);
    setEditingNoteIndex(null);
    setViewingNoteIndex(null);
    setTitle('');
    setDescription('');
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const currentDate = new Date();
    const dateStr = `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    if (editingNoteIndex !== null) {
      const updatedNotes = [...notes];
      updatedNotes[editingNoteIndex] = {
        ...updatedNotes[editingNoteIndex],
        title,
        description,
        date: dateStr,
        updatedAt: new Date().toISOString()
      };
      setNotes(updatedNotes);
    } else {
      const newNote = {
        id: Date.now(),
        title,
        description,
        date: dateStr,
        createdAt: new Date().toISOString()
      };
      setNotes([...notes, newNote]);
    }

    handleCloseModal();
  };

  const handleDeleteNote = (index) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const updatedNotes = notes.filter((_, i) => i !== index);
      setNotes(updatedNotes);
    }
  };

  const handleEditNote = (index) => {
    handleOpenModal(index);
    setOpenMenuIndex(null);
  };

  const toggleMenu = (index, e) => {
    e.stopPropagation();
    setOpenMenuIndex(openMenuIndex === index ? null : index);
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
              onClick={(e) => {
                console.log('Note card clicked! Index:', index);
                e.stopPropagation();
                handleOpenViewModal(index);
              }}
            >
              <div className="flex flex-col h-full justify-between">
                <div className="details">
                  <p className="text-2xl font-bold text-gray-900 leading-snug line-clamp-2">{note.title}</p>
                  <span className="block mt-3 text-base text-gray-700 line-clamp-4 leading-relaxed">{note.description}</span>
                </div>
                <div className="bottom-content flex flex-row justify-between items-center pt-4 mt-4 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-500">{note.date}</span>
                  <div className="settings relative" ref={index === openMenuIndex ? menuRef : null}>
                    <button
                      onClick={(e) => toggleMenu(index, e)}
                      className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    <AnimatePresence>
                      {openMenuIndex === index && (
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
                              handleEditNote(index);
                            }}
                          >
                            <Edit3 size={16} className="text-blue-500" />
                            Edit
                          </li>
                          <li
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 text-sm font-medium text-red-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(index);
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
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] max-w-[550px] w-full px-4"
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div className="border-b border-gray-200 flex justify-between items-center p-5 md:p-7">
                  <p className="text-xl font-medium text-slate-900">
                    {isViewMode ? 'View note' : (editingNoteIndex !== null ? 'Edit note' : 'Add a new note')}
                  </p>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 text-[#8b8989] hover:text-slate-700 transition-colors"
                  >
                    <X size={23} />
                  </button>
                </div>
                
                {/* View Mode */}
                {isViewMode && viewingNoteIndex !== null && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 md:p-8 space-y-5"
                  >
                    <div className="row title">
                      <label className="block mb-2 text-sm font-bold text-gray-500 uppercase tracking-wide">Title</label>
                      <p className="text-2xl font-bold text-gray-900 p-5 bg-gray-50 rounded-xl">
                        {notes[viewingNoteIndex].title}
                      </p>
                    </div>
                    <div className="row description">
                      <label className="block mb-2 text-sm font-bold text-gray-500 uppercase tracking-wide">Description</label>
                      <p className="text-base text-gray-800 p-5 bg-gray-50 rounded-xl whitespace-pre-wrap min-h-[180px] leading-relaxed">
                        {notes[viewingNoteIndex].description}
                      </p>
                    </div>
                    <div className="row date">
                      <label className="block mb-2 text-sm font-bold text-gray-500 uppercase tracking-wide">Date Created</label>
                      <p className="text-base text-gray-600 p-5 bg-gray-50 rounded-xl font-medium">
                        {notes[viewingNoteIndex].date}
                      </p>
                    </div>
                    <div className="flex gap-3 pt-3">
                      <button
                        onClick={handleOpenEditModalFromView}
                        className="flex-1 h-[52px] text-white text-base font-semibold rounded-xl cursor-pointer hover:opacity-90 transition-all hover:shadow-lg"
                        style={{ backgroundColor: '#1f2937' }}
                      >
                        <Edit3 size={18} className="inline mr-2" /> Edit Note
                      </button>
                      <button
                        onClick={handleCloseModal}
                        className="flex-1 h-[52px] text-gray-700 text-base font-semibold rounded-xl cursor-pointer hover:bg-gray-100 transition-all border border-gray-200 bg-white"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Edit/Add Mode */}
                {!isViewMode && (
                  <motion.form 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleSaveNote} 
                    className="p-6 md:p-8 space-y-5"
                  >
                    <div className="row title">
                      <label className="block mb-2 text-sm font-bold text-gray-500 uppercase tracking-wide">Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter note title..."
                        className="w-full h-[52px] px-5 py-4 border border-gray-300 rounded-xl text-base outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 font-medium"
                        autoFocus
                      />
                    </div>
                    <div className="row description">
                      <label className="block mb-2 text-sm font-bold text-gray-500 uppercase tracking-wide">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Write your note here..."
                        rows={6}
                        className="w-full h-[180px] px-5 py-4 border border-gray-300 rounded-xl text-base outline-none resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full h-[52px] text-white text-base font-semibold rounded-xl cursor-pointer hover:opacity-90 transition-all hover:shadow-lg"
                      style={{ backgroundColor: '#1f2937' }}
                    >
                      {editingNoteIndex !== null ? 'Update Note' : 'Add Note'}
                    </button>
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