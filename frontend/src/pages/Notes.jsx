import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, Edit3, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNoteIndex(null);
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-md p-5 h-[250px] flex flex-col justify-center items-center cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
            onClick={() => handleOpenModal()}
          >
            <div className="w-[78px] h-[78px] rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: '#6b7280' }}>
              <Plus size={40} className="text-gray-600" />
            </div>
            <p className="mt-5 font-medium text-gray-700">Add new note</p>
          </motion.div>

          {/* Notes List */}
          {notes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-md p-5 h-[250px] flex flex-col justify-between border border-gray-200"
            >
              <div className="flex flex-col h-full justify-between">
                <div className="details">
                  <p className="text-2xl font-medium text-black leading-snug line-clamp-2">{note.title}</p>
                  <span className="block mt-2 text-base text-black line-clamp-4">{note.description}</span>
                </div>
                <div className="bottom-content flex flex-row justify-between items-center pt-4 mt-4 border-t border-gray-300">
                  <span className="text-sm text-black">{note.date}</span>
                  <div className="settings relative" ref={index === openMenuIndex ? menuRef : null}>
                    <button
                      onClick={(e) => toggleMenu(index, e)}
                      className="p-1 text-[#6d6d6d] hover:text-slate-800 transition-colors"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    <AnimatePresence>
                      {openMenuIndex === index && (
                        <motion.ul
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="menu absolute bottom-full mb-2 right-0 bg-white shadow-md rounded-md py-1 z-50"
                          style={{
                            transformOrigin: 'bottom right',
                            boxShadow: '0 0 6px rgba(0,0,0,0.15)'
                          }}
                        >
                          <li
                            className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-[#f5f5f5] text-sm"
                            onClick={() => handleEditNote(index)}
                          >
                            <Edit3 size={14} />
                            Edit
                          </li>
                          <li
                            className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-[#f5f5f5] text-sm"
                            onClick={() => handleDeleteNote(index)}
                          >
                            <Trash2 size={14} />
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
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="popup-box fixed top-0 left-0 w-full h-full z-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] max-w-[400px] w-full px-4"
            >
              <div className="bg-white rounded-md overflow-hidden shadow-2xl">
                <div className="border-b border-[#ccc] flex justify-between items-center p-4 md:p-6">
                  <p className="text-xl font-medium text-slate-900">
                    {editingNoteIndex !== null ? 'Edit note' : 'Add a new note'}
                  </p>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 text-[#8b8989] hover:text-slate-700 transition-colors"
                  >
                    <X size={23} />
                  </button>
                </div>
                <form onSubmit={handleSaveNote} className="p-5 md:p-6 space-y-4">
                  <div className="row title">
                    <label className="block mb-2 text-lg text-black">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter note title..."
                      className="w-full h-[50px] px-4 py-3 border border-gray-400 rounded-md text-base outline-none focus:ring-2 focus:ring-gray-400 text-black"
                      autoFocus
                    />
                  </div>
                  <div className="row description">
                    <label className="block mb-2 text-lg text-black">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Write your note here..."
                      rows={6}
                      className="w-full h-[150px] px-4 py-3 border border-gray-400 rounded-md text-base outline-none resize-none focus:ring-2 focus:ring-gray-400 text-black"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-[50px] text-white text-base rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#1f2937' }}
                  >
                    {editingNoteIndex !== null ? 'Update Note' : 'Add Note'}
                  </button>
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