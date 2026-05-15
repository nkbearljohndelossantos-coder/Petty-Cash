const db = require('../config/db');

exports.getCategories = async (req, res) => {
  try {
    const categories = await db('categories').select('*').orderBy('name', 'asc');
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const [category] = await db('categories').insert({ name, description }).returning('*');
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
