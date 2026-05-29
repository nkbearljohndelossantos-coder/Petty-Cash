const db = require('../config/db');

exports.getDepartments = async (req, res) => {
  try {
    const departments = await db('departments').select('*').orderBy('name', 'asc');
    res.json({ success: true, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    const existing = await db('departments').where({ name: name.trim() }).first();
    if (existing) {
      return res.status(400).json({ success: false, message: 'Cost center already exists' });
    }

    const [id] = await db('departments').insert({ name: name.trim() });
    const department = await db('departments').where({ id }).first();
    res.status(201).json({ success: true, data: department });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const department = await db('departments').where({ id }).first();
    if (!department) {
      return res.status(404).json({ success: false, message: 'Cost center not found' });
    }

    if (name && name.trim() !== department.name) {
      const existing = await db('departments').where({ name: name.trim() }).first();
      if (existing) {
        return res.status(400).json({ success: false, message: 'Cost center name already exists' });
      }
    }

    await db('departments').where({ id }).update({ name: name.trim() });
    const updated = await db('departments').where({ id }).first();
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await db('departments').where({ id }).first();
    if (!department) {
      return res.status(404).json({ success: false, message: 'Cost center not found' });
    }

    const userCount = await db('users').where({ department_id: id }).count('id as cnt').first();
    if (userCount?.cnt > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${userCount.cnt} user(s) are assigned to this cost center.`
      });
    }

    const expenseCount = await db('expenses').where({ department_id: id }).count('id as cnt').first();
    if (expenseCount?.cnt > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: used in ${expenseCount.cnt} expense record(s).`
      });
    }

    await db('departments').where({ id }).del();
    res.json({ success: true, message: 'Cost center deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
