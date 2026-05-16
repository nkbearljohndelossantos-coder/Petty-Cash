const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const knex = require('../config/db'); // Correct path

let redisConnection;
let queues = {};
let useRedis = false;

const initQueueManager = async () => {
  if (process.env.REDIS_ENABLED === 'false') {
    console.log('Redis is disabled by configuration. Using Database Queue.');
    useRedis = false;
    return;
  }

  try {
    redisConnection = new IORedis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('Redis connection failed. Falling back to Database Queue.');
          useRedis = false;
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      }
    });

    redisConnection.on('error', (err) => {
      if (!useRedis) {
        // Only log as warn if we already know we're using fallback
        console.warn('Redis Fallback Notice:', err.message);
      } else {
        console.error('Redis Error:', err.message);
      }
      useRedis = false;
    });

    redisConnection.on('connect', () => {
      console.log('Connected to Redis. Using BullMQ.');
      useRedis = true;
    });

    // Initial check
    await redisConnection.ping().catch(() => { useRedis = false; });
  } catch (err) {
    console.warn('Redis initialization failed. Using Database Queue.');
    useRedis = false;
  }
};

const getQueue = (name) => {
  if (useRedis && !queues[name]) {
    queues[name] = new Queue(name, { connection: redisConnection });
  }
  return queues[name];
};

const addJob = async (queueName, jobName, data, options = {}) => {
  if (useRedis) {
    const queue = getQueue(queueName);
    try {
      return await queue.add(jobName, data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        ...options
      });
    } catch (err) {
      console.error(`Failed to add job to BullMQ: ${err.message}. Falling back to DB.`);
      // Fallback to DB if Redis fails mid-execution
    }
  }

  // Database Fallback
  console.log(`Adding job [${jobName}] to Database Fallback Queue`);
  return await knex('queue_fallback_jobs').insert({
    queue_name: queueName,
    job_name: jobName,
    data: JSON.stringify(data),
    priority: options.priority || 0,
    next_run_at: new Date(Date.now() + (options.delay || 0))
  });
};

const processDBJobs = async (processorMap) => {
  if (useRedis) return; // BullMQ handles this via Workers

  const jobs = await knex('queue_fallback_jobs')
    .where('status', 'pending')
    .andWhere('next_run_at', '<=', new Date())
    .orderBy('priority', 'desc')
    .limit(10);

  for (const job of jobs) {
    const processor = processorMap[job.queue_name];
    if (processor) {
      try {
        await processor(job.job_name, JSON.parse(job.data));
        await knex('queue_fallback_jobs').where('id', job.id).update({ status: 'completed' });
      } catch (err) {
        console.error(`Job ${job.id} failed: ${err.message}`);
        const attempts = job.attempts + 1;
        const status = attempts >= 3 ? 'failed' : 'pending';
        const nextRun = new Date(Date.now() + Math.pow(2, attempts) * 1000);
        
        await knex('queue_fallback_jobs').where('id', job.id).update({
          attempts,
          status,
          next_run_at: nextRun
        });
      }
    }
  }
};

module.exports = {
  initQueueManager,
  addJob,
  getQueue,
  processDBJobs,
  isUsingRedis: () => useRedis,
  getRedisConnection: () => redisConnection
};
