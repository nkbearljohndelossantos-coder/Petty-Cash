const path = require('path');
const fs = require('fs');
const envPath = path.join(__dirname, '../.env');

require('dotenv').config({ path: envPath });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
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
  const db = require('./config/db');
  
  // 1. Run Migrations First (Crucial for schema consistency)
  try {
    console.log('--- DIAGNOSTIC LOGS ---');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_NAME:', process.env.DB_NAME);
    
    const migrationsPath = path.join(__dirname, 'db/migrations');
    console.log('Migrations Path:', migrationsPath);
    console.log('Migrations Folder Exists:', fs.existsSync(migrationsPath));
    
    console.log('Database connecting...');
    await db.raw('SELECT 1');
    console.log('Database connected successfully (MySQL)');
    
    console.log('Checking for database migrations...');
    // Random delay to avoid race conditions between multiple instances (Hostinger zombie processes)
    const delay = Math.floor(Math.random() * 2000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    await db.migrate.forceFreeMigrationsLock(); 
    const [batchNo, log] = await db.migrate.latest();
    if (log.length > 0) {
      console.log(`Success: Run ${log.length} migrations (Batch ${batchNo})`);
      console.log('Migrations:', log.join(', '));
    } else {
      console.log('Database schema is already up to date according to migration history.');
    }

    // 1.5 Schema Repair Bootstrapper: Check for missing tables regardless of migration status
    const coreTables = ['users', 'expenses', 'funds', 'notifications'];
    for (const tableName of coreTables) {
      const exists = await db.schema.hasTable(tableName);
      if (!exists) {
        console.log(`CRITICAL: Table "${tableName}" is physically missing from DB. Reconstructing...`);
        if (tableName === 'users' || tableName === 'expenses') {
          const initialSchema = require('./db/migrations/20260512000000_initial_schema');
          await initialSchema.up(db);
          console.log('Initial schema reconstruction successful.');
        } else if (tableName === 'funds') {
          const fundsSchema = require('./db/migrations/20260512075907_create_funds_table');
          await fundsSchema.up(db);
          console.log('Funds table reconstruction successful.');
        } else if (tableName === 'notifications') {
          const notifSchema = require('./db/migrations/20260515064955_add_notifications_and_email_system');
          await notifSchema.up(db);
          console.log('Notifications system reconstruction successful.');
        }
      }
    }
  } catch (err) {
    console.error('CRITICAL: Database initialization failed!');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
  }

  // 2. Initialize other services
  await initQueueManager();
  initWorkers();
  initScheduler();
  initSocket(server);

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
const frontendPath = path.join(__dirname, '../dist');
const indexPath = path.join(frontendPath, 'index.html');

if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  console.log('Serving frontend from:', frontendPath);
} else {
  console.warn('Frontend dist folder not found at:', frontendPath);
}

app.get(/.*/, (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Route Not Found' });
  }
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('NKB Petty Cash API is running (Frontend not built yet)...');
  }
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
