const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

router.use(protect);
router.use(authorize('Super Admin'));

router.get('/', async (req, res) => {
  try {
    const users = await db('users')
      .leftJoin('departments', 'users.department_id', 'departments.id')
      .select('users.*', 'departments.name as department_name')
      .orderBy('users.created_at', 'desc');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { username, password, full_name, email, role, department_id } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const [id] = await db('users').insert({
      username,
      password: hashedPassword,
      full_name,
      email,
      role,
      department_id: department_id || null
    });
    const user = await db('users').where({ id }).first();
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { username, password, full_name, email, role, department_id, status } = req.body;
    const updateData = {
      username,
      full_name,
      email,
      role,
      department_id: department_id || null,
      status: status !== undefined ? status : true,
      updated_at: db.fn.now()
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await db('users').where({ id: req.params.id }).update(updateData);
    const user = await db('users').where({ id: req.params.id }).first();
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    // Prevent deleting self
    if (req.params.id == req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    await db('users').where({ id: req.params.id }).del();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
