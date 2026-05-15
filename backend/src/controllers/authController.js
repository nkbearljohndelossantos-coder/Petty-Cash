const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logActivity } = require('../utils/logService');
const db = require('../config/db');

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await db('users').where({ username }).first();

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.status) {
      return res.status(401).json({ success: false, message: 'Account is disabled' });
    }

    // Log successful login
    await logActivity(user.id, 'LOGIN', `User ${user.username} logged in successfully`, req.ip);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, department_id: user.department_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });

    // Log activity
    await db('activity_logs').insert({
      user_id: user.id,
      action: 'LOGIN',
      details: 'User logged in successfully',
      ip_address: req.ip
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await db('users')
      .where({ id: req.user.id })
      .select('id', 'username', 'full_name', 'email', 'role', 'department_id', 'status')
      .first();

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
