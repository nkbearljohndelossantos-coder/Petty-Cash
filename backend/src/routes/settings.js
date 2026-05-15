const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const settings = await db('settings').select('*');
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    res.json({ success: true, data: settingsObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await db('settings').where({ key }).update({ value, updated_at: db.fn.now() });
    }
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
