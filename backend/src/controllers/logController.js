const db = require('../config/db');

exports.getLogs = async (req, res) => {
  try {
    const logs = await db('activity_logs')
      .leftJoin('users', 'activity_logs.user_id', 'users.id')
      .select(
        'activity_logs.*',
        'users.full_name',
        'users.username'
      )
      .orderBy('activity_logs.created_at', 'desc')
      .limit(500);

    res.json({ success: true, data: logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
