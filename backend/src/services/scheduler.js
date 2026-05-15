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

  console.log('Cron Scheduler Initialized.');
};

module.exports = {
  initScheduler
};
