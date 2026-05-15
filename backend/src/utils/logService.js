const db = require('../config/db');

/**
 * Log a system activity
 * @param {number} userId - The user performing the action
 * @param {string} action - Action identifier (e.g., 'LOGIN', 'CREATE_EXPENSE')
 * @param {string} details - Detailed description or JSON string
 * @param {string} ip - Optional IP address
 */
async function logActivity(userId, action, details, ip = '') {
  try {
    await db('activity_logs').insert({
      user_id: userId,
      action: action,
      details: details,
      ip_address: ip
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

module.exports = { logActivity };
