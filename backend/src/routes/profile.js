const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/auth');
const { logActivity } = require('../utils/logService');

// Update password
router.put('/password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db('users').where({ id: req.user.id }).update({ password: hashedPassword });
    
    await logActivity(req.user.id, 'CHANGE_PASSWORD', 'User updated their security password');

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
