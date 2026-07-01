const db = require('../config/db');

exports.getNotes = async (req, res) => {
  try {
    const notes = await db('notes')
      .where({ user_id: req.user.id })
      .orderBy('updated_at', 'desc');

    res.json({ success: true, data: notes });
  } catch (err) {
    console.error('getNotes error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to get notes' });
  }
};

exports.getNote = async (req, res) => {
  try {
    const note = await db('notes')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({ success: true, data: note });
  } catch (err) {
    console.error('getNote error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to get note' });
  }
};

exports.createNote = async (req, res) => {
  try {
    const { title, description } = req.body;

    const [noteId] = await db('notes').insert({
      user_id: req.user.id,
      title,
      description
    });

    const note = await db('notes').where({ id: noteId }).first();

    res.status(201).json({ success: true, data: note });
  } catch (err) {
    console.error('createNote error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create note' });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { title, description } = req.body;

    const updatedCount = await db('notes')
      .where({ id: req.params.id, user_id: req.user.id })
      .update({
        title,
        description,
        updated_at: db.fn.now()
      });

    if (updatedCount === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const updatedNote = await db('notes').where({ id: req.params.id }).first();

    res.json({ success: true, data: updatedNote });
  } catch (err) {
    console.error('updateNote error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update note' });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const deletedCount = await db('notes')
      .where({ id: req.params.id, user_id: req.user.id })
      .del();

    if (deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (err) {
    console.error('deleteNote error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete note' });
  }
};