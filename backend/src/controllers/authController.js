const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logActivity } = require('../utils/logService');
const db = require('../config/db');

async function verifyPassword(plainPassword, storedHash, userId) {
  if (!storedHash) return false;

  if (storedHash.startsWith('$2')) {
    return bcrypt.compare(plainPassword, storedHash);
  }

  // Legacy plain-text password — rehash on successful login
  if (storedHash === plainPassword) {
    const hashed = await bcrypt.hash(plainPassword, 10);
    await db('users').where({ id: userId }).update({ password: hashed });
    return true;
  }

  return false;
}

function isAccountDisabled(status) {
  return status === false || status === 0 || status === '0';
}

exports.login = async (req, res) => {
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('[AUTH] JWT_SECRET is not configured');
    return res.status(500).json({ success: false, message: 'Server authentication is not configured' });
  }

  try {
    const user = await db('users').where({ username }).first();

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (isAccountDisabled(user.status)) {
      return res.status(401).json({ success: false, message: 'Account is disabled' });
    }

    const passwordValid = await verifyPassword(password, user.password, user.id);
    if (!passwordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
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
