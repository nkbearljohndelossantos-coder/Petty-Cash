const knex = require('../config/db');

const getNotifications = async (req, res) => {
  try {
    const notifications = await knex('notifications')
      .where('user_id', req.user.id)
      .orderBy('created_at', 'desc')
      .limit(50);
    
    const unreadCount = await knex('notifications')
      .where({ user_id: req.user.id, is_read: false })
      .count('id as count')
      .first();

    res.json({
      notifications,
      unreadCount: parseInt(unreadCount.count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await knex('notifications')
      .where({ id, user_id: req.user.id })
      .update({ is_read: true });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await knex('notifications')
      .where({ user_id: req.user.id })
      .update({ is_read: true });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getPreferences = async (req, res) => {
  try {
    let prefs = await knex('notification_preferences')
      .where('user_id', req.user.id)
      .first();
    
    if (!prefs) {
      prefs = { email_enabled: true, in_app_enabled: true };
    }

    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePreferences = async (req, res) => {
  try {
    const { email_enabled, in_app_enabled } = req.body;
    
    await knex('notification_preferences')
      .insert({
        user_id: req.user.id,
        email_enabled,
        in_app_enabled,
        updated_at: new Date()
      })
      .onConflict('user_id')
      .merge();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences
};
