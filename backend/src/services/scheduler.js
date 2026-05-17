const cron = require('node-cron');
const { addJob } = require('./queueManager');
const knex = require('../config/db');

const initScheduler = () => {
  // 1. Daily Summary Report (Run at 11:59 PM)
  cron.schedule('59 23 * * *', async () => {
    console.log('Scheduling Daily Summary Reports...');
    await addJob('email', 'send_scheduled_report', { type: 'daily' });
  });

  // 2. Monthly Financial Report (Run at 1 AM on the 1st of every month)
  cron.schedule('0 1 1 * *', async () => {
    console.log('Scheduling Monthly Financial Reports...');
    await addJob('email', 'send_scheduled_report', { type: 'monthly' });
  });

  // 3. Smart Escalation Check (Run every hour)
  cron.schedule('0 * * * *', async () => {
    console.log('Running Escalation Checks...');
    await addJob('notifications', 'escalation_check', {});
  });

  // 4. Low Fund Check (Run every 4 hours)
  cron.schedule('0 */4 * * *', async () => {
    console.log('Running Low Fund Checks...');
    const lowFundThreshold = process.env.LOW_FUND_THRESHOLD || 5000;
    const funds = await knex('funds').select('*');
    
    for (const fund of funds) {
      if (fund.balance < lowFundThreshold) {
        // Notify Admins
        const admins = await knex('users').whereIn('role', ['Super Admin', 'Accounting']);
        for (const admin of admins) {
          // Add job to notify
          console.log(`Low fund alert for fund ${fund.name} sent to ${admin.username}`);
        }
      }
    }
  });

  // 5. Scheduled Notifications Dispatcher (Run every minute)
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const pendingSchedules = await knex('notification_schedule')
        .where('status', 'active')
        .where('schedule_time', '<=', now);

      if (pendingSchedules.length > 0) {
        console.log(`[Scheduler] Found ${pendingSchedules.length} scheduled notifications to process.`);
      }

      for (const schedule of pendingSchedules) {
        console.log(`[Scheduler] Dispatching notification: "${schedule.title}" (ID: ${schedule.id})`);
        
        // 1. Resolve recipients
        let targetUserIds = [];
        if (schedule.recipients_type === 'all') {
          const users = await knex('users').select('id');
          targetUserIds = users.map(u => u.id);
        } else if (schedule.recipients_type === 'department') {
          let departments = [];
          try {
            departments = JSON.parse(schedule.recipients_data);
          } catch {
            departments = schedule.recipients_data ? schedule.recipients_data.split(',') : [];
          }
          const users = await knex('users').whereIn('department', departments).select('id');
          targetUserIds = users.map(u => u.id);
        } else if (schedule.recipients_type === 'users') {
          try {
            targetUserIds = JSON.parse(schedule.recipients_data);
          } catch {
            targetUserIds = schedule.recipients_data ? schedule.recipients_data.split(',').map(id => parseInt(id)) : [];
          }
        }

        if (targetUserIds.length > 0) {
          const { sendToUser } = require('./socketService');
          
          for (const userId of targetUserIds) {
            // Insert notification
            const [notifId] = await knex('notifications').insert({
              user_id: userId,
              title: schedule.title,
              message: schedule.message,
              type: schedule.priority === 'critical' ? 'error' : (schedule.priority === 'important' ? 'warning' : 'info'),
              priority: schedule.priority,
              is_read: false,
              category: 'alert',
              created_at: new Date()
            }).returning('id');

            // Insert tracking read state
            await knex('notification_reads').insert({
              notification_id: notifId,
              user_id: userId,
              status: 'sent',
              created_at: new Date()
            });

            // Emit live websocket
            sendToUser(userId, 'new_notification', {
              id: notifId,
              title: schedule.title,
              message: schedule.message,
              type: schedule.priority === 'critical' ? 'error' : (schedule.priority === 'important' ? 'warning' : 'info'),
              priority: schedule.priority,
              is_read: false,
              category: 'alert',
              created_at: new Date()
            });
          }
        }

        // Calculate next runtime
        let nextStatus = 'completed';
        let nextRunTime = schedule.schedule_time;

        if (schedule.frequency !== 'once') {
          nextStatus = 'active';
          let d = new Date(schedule.schedule_time);
          if (schedule.frequency === 'daily') {
            d.setDate(d.getDate() + 1);
          } else if (schedule.frequency === 'weekly') {
            d.setDate(d.getDate() + 7);
          } else if (schedule.frequency === 'monthly') {
            d.setMonth(d.getMonth() + 1);
          }
          nextRunTime = d;
        }

        await knex('notification_schedule')
          .where('id', schedule.id)
          .update({
            status: nextStatus,
            schedule_time: nextRunTime,
            last_run: now
          });

        console.log(`[Scheduler] Notification "${schedule.title}" successfully sent to ${targetUserIds.length} users.`);
      }
    } catch (err) {
      console.error('[Scheduler] Error in scheduled notification dispatcher:', err.message);
    }
  });

  console.log('Cron Scheduler Initialized.');
};

module.exports = {
  initScheduler
};
