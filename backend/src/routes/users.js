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
    const [user] = await db('users').insert({
      username,
      password: hashedPassword,
      full_name,
      email,
      role,
      department_id
    }).returning('*');
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
