const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const departments = await db('departments').select('*').orderBy('name', 'asc');
    res.json({ success: true, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
