const { Worker } = require('bullmq');
const { getRedisConnection, isUsingRedis, processDBJobs } = require('./queueManager');
const { sendEmail } = require('./emailService');

const processors = {
  email: async (jobName, data) => {
    if (jobName === 'send_notification_email') {
      await sendEmail(data);
    } else if (jobName === 'send_scheduled_report') {
      // Logic for reports
      console.log('Processing scheduled report...');
    }
  },
  notifications: async (jobName, data) => {
    if (jobName === 'escalation_check') {
      // Logic for smart escalation
      console.log('Checking for escalations...');
    }
  }
};

const initWorkers = () => {
  if (isUsingRedis()) {
    console.log('Initializing BullMQ Workers...');
    Object.keys(processors).forEach(queueName => {
      new Worker(queueName, async (job) => {
        await processors[queueName](job.name, job.data);
      }, { connection: getRedisConnection() });
    });
  } else {
    console.log('Initializing Database Fallback Workers (Polling)...');
    // Start polling for DB jobs
    setInterval(() => {
      processDBJobs(processors);
    }, 5000);
  }
};

module.exports = {
  initWorkers,
  processors
};
