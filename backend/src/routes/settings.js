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
    // Drop all tables in reverse order of dependencies
    // This allows a complete fresh start
    await db.schema.dropTableIfExists('notifications');
    await db.schema.dropTableIfExists('activity_logs');
    await db.schema.dropTableIfExists('expense_attachments');
    await db.schema.dropTableIfExists('expenses');
    await db.schema.dropTableIfExists('funds');
    await db.schema.dropTableIfExists('users');
    await db.schema.dropTableIfExists('categories');
    await db.schema.dropTableIfExists('departments');
    await db.schema.dropTableIfExists('settings');
    await db.schema.dropTableIfExists('knex_migrations_lock');
    await db.schema.dropTableIfExists('knex_migrations');

    res.json({ success: true, message: 'Database has been wiped. The server will now restart and recreate the initial schema.' });
    
    // Give time for response to be sent, then exit to trigger restart
    setTimeout(() => {
      process.exit(0);
    }, 1500);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
