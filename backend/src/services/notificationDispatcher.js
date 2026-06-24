const knex = require('../config/db');
const { sendToUser } = require('./socketService');
const { addJob } = require('./queueManager');

const dispatchNotification = async (userId, payload) => {
  const { title, message, type, link, data, templateName, priority } = payload;

  try {
    // 1. Get User Preferences
    let prefs = await knex('notification_preferences').where('user_id', userId).first();
    
    // Default preferences if not set
    if (!prefs) {
      prefs = { email_enabled: true, in_app_enabled: true };
      // Optional: Initialize prefs in DB
      await knex('notification_preferences').insert({ user_id: userId, ...prefs }).onConflict('user_id').ignore();
    }

    // 2. Handle In-App Notification
    if (prefs.in_app_enabled) {
      const [notifId] = await knex('notifications').insert({
        user_id: userId,
        title,
        message,
        type: type || 'info',
        priority: priority || 'normal',
        link,
        is_read: false
      });

      // Send real-time update via Socket.IO
      sendToUser(userId, 'new_notification', {
        id: notifId,
        title,
        message,
        type: type || 'info',
        priority: priority || 'normal',
        link,
        created_at: new Date()
      });
    }

    // 3. Handle Email Notification
    if (prefs.email_enabled && templateName) {
      const user = await knex('users').where('id', userId).first();
      if (user && user.email) {
        await addJob('email', 'send_notification_email', {
          recipient: user.email,
          templateName,
          data: {
            ...data,
            fullName: user.full_name,
            title,
            message
          }
        });
      }
    }

    return true;
  } catch (err) {
    console.error('Notification Dispatcher Error:', err.message);
    return false;
  }
};

module.exports = {
  dispatchNotification
};
