const knex = require('../config/db');

// --- USER ENDPOINTS ---

const getNotifications = async (req, res) => {
  try {
    const { search, priority, status, category } = req.query;
    
    let query = knex('notifications').where('user_id', req.user.id);

    // Search filter
    if (search) {
      query = query.where(function() {
        this.where('title', 'like', `%${search}%`)
            .orWhere('message', 'like', `%${search}%`);
      });
    }

    // Priority filter
    if (priority) {
      query = query.where('priority', priority);
    }

    // Status filter (read, unread, archived)
    if (status === 'unread') {
      query = query.where({ is_read: false, archived: false });
    } else if (status === 'read') {
      query = query.where({ is_read: true, archived: false });
    } else if (status === 'archived') {
      query = query.where('archived', true);
    } else {
      // Default: show active non-archived notifications
      query = query.where('archived', false);
    }

    // Category filter
    if (category) {
      query = query.where('category', category);
    }

    const notifications = await query
      .orderBy('created_at', 'desc')
      .limit(100);

    const unreadCount = await knex('notifications')
      .where({ user_id: req.user.id, is_read: false, archived: false })
      .count('id as count')
      .first();

    res.json({
      notifications,
      unreadCount: parseInt(unreadCount.count || 0)
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

    await knex('notification_reads')
      .where({ notification_id: id, user_id: req.user.id })
      .update({
        status: 'read',
        read_at: new Date()
      });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await knex('notifications')
      .where({ user_id: req.user.id, is_read: false })
      .update({ is_read: true });

    await knex('notification_reads')
      .where({ user_id: req.user.id })
      .whereIn('status', ['sent', 'delivered'])
      .update({
        status: 'read',
        read_at: new Date()
      });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const acknowledgeNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    await knex('notifications')
      .where({ id, user_id: req.user.id })
      .update({ acknowledged: true, is_read: true });

    await knex('notification_reads')
      .where({ notification_id: id, user_id: req.user.id })
      .update({
        status: 'acknowledged',
        read_at: knex.raw('COALESCE(read_at, NOW())'),
        acknowledged_at: new Date()
      });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const archiveNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { archive = true } = req.body;
    
    await knex('notifications')
      .where({ id, user_id: req.user.id })
      .update({ archived: archive });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// --- ADMIN ACTIONS (Super Admin / Accounting) ---

const broadcastNotification = async (req, res) => {
  try {
    const { title, message, priority, recipients_type, recipients_data, attachment_url, task_link, category } = req.body;

    // 1. Resolve recipients list
    let targetUserIds = [];
    if (recipients_type === 'all') {
      const users = await knex('users').select('id');
      targetUserIds = users.map(u => u.id);
    } else if (recipients_type === 'department') {
      const departments = Array.isArray(recipients_data) ? recipients_data : [recipients_data];
      const users = await knex('users').whereIn('department', departments).select('id');
      targetUserIds = users.map(u => u.id);
    } else if (recipients_type === 'users') {
      targetUserIds = Array.isArray(recipients_data) 
        ? recipients_data.map(id => parseInt(id)) 
        : [parseInt(recipients_data)];
    }

    if (targetUserIds.length === 0) {
      return res.status(400).json({ error: 'No recipient users found matching criteria.' });
    }

    const { sendToUser } = require('../services/socketService');

    // 2. Insert notifications & read logs, emit websocket
    for (const userId of targetUserIds) {
      const [notifId] = await knex('notifications').insert({
        user_id: userId,
        title,
        message,
        type: priority === 'critical' ? 'error' : (priority === 'important' ? 'warning' : 'info'),
        priority: priority || 'normal',
        sender_id: req.user.id,
        attachment_url,
        task_link,
        acknowledged: false,
        archived: false,
        category: category || 'general',
        created_at: new Date()
      });

      await knex('notification_reads').insert({
        notification_id: notifId,
        user_id: userId,
        status: 'sent',
        created_at: new Date()
      });

      // Send live event
      sendToUser(userId, 'new_notification', {
        id: notifId,
        title,
        message,
        type: priority === 'critical' ? 'error' : (priority === 'important' ? 'warning' : 'info'),
        priority: priority || 'normal',
        sender_id: req.user.id,
        attachment_url,
        task_link,
        acknowledged: false,
        category: category || 'general',
        created_at: new Date()
      });
    }

    res.json({ success: true, recipientsCount: targetUserIds.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSentNotifications = async (req, res) => {
  try {
    // Fetch notifications broadcasted by Admins (has sender_id)
    const sentList = await knex('notifications')
      .select('notifications.*', 'sender.username as sender_username')
      .leftJoin('users as sender', 'notifications.sender_id', 'sender.id')
      .whereNotNull('notifications.sender_id')
      .orderBy('notifications.created_at', 'desc')
      .limit(100);

    const results = [];
    for (const notif of sentList) {
      const tracking = await knex('notification_reads')
        .select('notification_reads.*', 'users.username', 'users.full_name', 'users.department')
        .leftJoin('users', 'notification_reads.user_id', 'users.id')
        .where('notification_id', notif.id);

      results.push({
        ...notif,
        tracking
      });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// --- SCHEDULER MANAGEMENT ---

const getSchedules = async (req, res) => {
  try {
    const schedules = await knex('notification_schedule')
      .select('notification_schedule.*', 'notification_templates.name as template_name')
      .leftJoin('notification_templates', 'notification_schedule.template_id', 'notification_templates.id')
      .orderBy('schedule_time', 'asc');
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createSchedule = async (req, res) => {
  try {
    const { template_id, title, message, priority, recipients_type, recipients_data, schedule_time, frequency } = req.body;
    
    const [id] = await knex('notification_schedule').insert({
      template_id: template_id || null,
      title,
      message,
      priority: priority || 'normal',
      recipients_type: recipients_type || 'all',
      recipients_data: typeof recipients_data === 'object' ? JSON.stringify(recipients_data) : recipients_data,
      schedule_time: new Date(schedule_time),
      frequency: frequency || 'once',
      status: 'active',
      created_at: new Date()
    });

    res.json({ id, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    await knex('notification_schedule').where('id', id).del();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// --- TEMPLATES MANAGEMENT ---

const getTemplates = async (req, res) => {
  try {
    const templates = await knex('notification_templates').orderBy('name', 'asc');
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createTemplate = async (req, res) => {
  try {
    const { name, subject, body, type } = req.body;
    
    const [id] = await knex('notification_templates').insert({
      name,
      subject,
      body,
      type: type || 'info',
      updated_at: new Date()
    });
    
    res.json({ id, name, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, body, type } = req.body;
    
    await knex('notification_templates').where('id', id).update({
      name,
      subject,
      body,
      type: type || 'info',
      updated_at: new Date()
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await knex('notification_templates').where('id', id).del();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  // User Actions
  getNotifications,
  markAsRead,
  markAllAsRead,
  acknowledgeNotification,
  archiveNotification,
  
  // Admin Actions
  broadcastNotification,
  getSentNotifications,
  
  // Schedule Management
  getSchedules,
  createSchedule,
  deleteSchedule,
  
  // Templates Management
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
