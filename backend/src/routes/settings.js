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

router.post('/reset-db', protect, authorize('Super Admin'), async (req, res) => {
  try {
    // Disable foreign key checks to allow truncation
    await db.raw('SET FOREIGN_KEY_CHECKS = 0');

    // Clear transaction and log tables
    await db('notifications').truncate();
    await db('activity_logs').truncate();
    await db('expense_attachments').truncate();
    await db('expenses').truncate();
    await db('funds').truncate();
    
    // Optional: Also clear categories and departments if you want a TRULY fresh start
    // But keeping them for now as per "Data lang" usually meaning transactions
    // await db('categories').truncate();
    // await db('departments').truncate();

    // Re-enable foreign key checks
    await db.raw('SET FOREIGN_KEY_CHECKS = 1');

    res.json({ success: true, message: 'Transaction data has been cleared successfully. User accounts and system settings were preserved.' });
  } catch (err) {
    // Ensure foreign key checks are re-enabled even on error
    await db.raw('SET FOREIGN_KEY_CHECKS = 1');
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
