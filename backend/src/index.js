require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const http = require('http');

// Services
const { initSocket } = require('./services/socketService');
const { initQueueManager, getQueue, isUsingRedis } = require('./services/queueManager');
const { initWorkers } = require('./services/worker.js');
const { initScheduler } = require('./services/scheduler.js');

// Bull Board
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Services
(async () => {
  await initQueueManager();
  initWorkers();
  initScheduler();
  initSocket(server);

  // Test DB Connection
  const db = require('./config/db');
  try {
    await db.raw('SELECT 1');
    console.log('Database connected successfully (MySQL)');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    // In production, we might not want to exit, but it helps identify 503 causes
  }

  // Setup Bull Board if using Redis
  if (isUsingRedis()) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');
    
    createBullBoard({
      queues: [
        new BullMQAdapter(getQueue('email')),
        new BullMQAdapter(getQueue('notifications'))
      ],
      serverAdapter: serverAdapter,
    });
    
    app.use('/admin/queues', serverAdapter.getRouter());
    console.log('Bull Board initialized at /admin/queues');
  }
})();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/users', require('./routes/users'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/users/profile', require('./routes/profile'));
app.use('/api/funds', require('./routes/fundRoutes'));
app.use('/api/backup', require('./routes/backup'));

// New Notification Routes
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/email-automation', require('./routes/emailAutomation'));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Serve Frontend in Production
// This assumes the frontend/dist folder is built and placed correctly relative to the backend
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Route Not Found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
