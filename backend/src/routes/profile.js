const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/auth');
const { logActivity } = require('../utils/logService');

// Update password
router.put('/password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Both current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
  }

  try {
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    let isMatch = false;
    if (user.password && user.password.startsWith('$2')) {
      isMatch = await bcrypt.compare(currentPassword, user.password);
    } else {
      isMatch = (user.password === currentPassword);
    }

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db('users').where({ id: req.user.id }).update({ password: hashedPassword });
    
    await logActivity(req.user.id, 'CHANGE_PASSWORD', 'User updated their security password');

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating password' });
  }
});

module.exports = router;
