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
    const [id] = await db('categories').insert({ name, description });
    const category = await db('categories').where({ id }).first();
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const category = await db('categories').where({ id }).first();
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name && name !== category.name) {
      const existing = await db('categories').where({ name }).first();
      if (existing) {
        return res.status(400).json({ success: false, message: 'Category name already exists' });
      }
    }

    await db('categories').where({ id }).update({ name, description });
    const updatedCategory = await db('categories').where({ id }).first();
    
    res.json({ success: true, data: updatedCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await db('categories').where({ id }).first();
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const count = await db('expenses').where({ category_id: id }).count('id as cnt').first();
    if (count && count.cnt > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete category because it is currently assigned to ${count.cnt} expense record(s).` 
      });
    }

    await db('categories').where({ id }).del();
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

