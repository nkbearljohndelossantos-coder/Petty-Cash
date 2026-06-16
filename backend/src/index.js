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
    try {
      const [batchNo, log] = await db.migrate.latest();
      if (log.length > 0) {
        console.log(`Success: Run ${log.length} migrations (Batch ${batchNo})`);
        console.log('Migrations:', log.join(', '));
      } else {
        console.log('Database schema is already up to date according to migration history.');
      }
    } catch (migErr) {
      if (migErr.message && migErr.message.includes('locked')) {
        console.warn('Migration lock detected, forcing unlock and retrying...');
        await db.migrate.forceFreeMigrationsLock();
        const [batchNo2, log2] = await db.migrate.latest();
        if (log2.length > 0) {
          console.log(`Success (retry): Run ${log2.length} migrations (Batch ${batchNo2})`);
        } else {
          console.log('Database schema is already up to date according to migration history.');
        }
      } else {
        throw migErr;
      }
    }

    // 1.5 Schema Repair Bootstrapper: Check for missing tables regardless of migration status
    console.log('--- SCHEMA REPAIR ENGINE: INITIALIZING EXISTENCE CHECK ---');
    const coreTables = ['users', 'categories', 'departments', 'expenses', 'funds', 'activity_logs', 'notifications', 'notification_templates', 'notification_schedule', 'notification_recipients', 'notification_reads'];
    for (const tableName of coreTables) {
      const exists = await db.schema.hasTable(tableName);
      console.log(`Checking Table "${tableName}": ${exists ? 'EXISTS' : 'MISSING'}`);
      if (!exists) {
        console.log(`CRITICAL REPAIR: Table "${tableName}" is physically missing. Reconstructing...`);
        try {
          if (['users', 'expenses', 'categories', 'departments', 'activity_logs'].includes(tableName)) {
            const initialSchema = require('./db/migrations/20260512000000_initial_schema');
            await initialSchema.up(db);
            
            // Secondary repair for expenses columns
            if (tableName === 'expenses') {
              const quantitySchema = require('./db/migrations/20260512080000_add_quantity_unit_to_expenses');
              await quantitySchema.up(db);
            }
            
            console.log(`Repair: [${tableName}] and related core tables reconstruction successful.`);
          } else if (tableName === 'funds') {
            const fundsSchema = require('./db/migrations/20260512075907_create_funds_table');
            await fundsSchema.up(db);
            console.log('Repair: Funds table reconstruction successful.');
          } else if (tableName === 'notifications') {
            const notifSchema = require('./db/migrations/20260515064955_add_notifications_and_email_system');
            await notifSchema.up(db);
            console.log('Repair: Notifications system reconstruction successful.');
          } else if (['notification_templates', 'notification_schedule', 'notification_recipients', 'notification_reads'].includes(tableName)) {
            const notifCenterSchema = require('./db/migrations/20260517090000_create_notification_center_tables');
            await notifCenterSchema.up(db);
            console.log(`Repair: [${tableName}] and related Notification Center tables reconstruction successful.`);
          }
        } catch (repairErr) {
          console.error(`Repair FAILED for table "${tableName}":`, repairErr.message);
          // Continue to next table even if one fails
        }
      } else if (tableName === 'expenses') {
        // Deep repair for existing expenses table
        const hasQuantity = await db.schema.hasColumn('expenses', 'quantity');
        if (!hasQuantity) {
          console.log('REPAIR: "expenses" table is missing "quantity" column. Patching...');
          const quantitySchema = require('./db/migrations/20260512080000_add_quantity_unit_to_expenses');
          await quantitySchema.up(db);
        }
      } else if (tableName === 'notifications') {
        // Deep repair for existing notifications table (checking columns that might have failed to create)
        const hasArchived = await db.schema.hasColumn('notifications', 'archived');
        if (!hasArchived) {
          console.log('REPAIR: "notifications" table is missing new enterprise columns. Patching...');
          const notifCenterSchema = require('./db/migrations/20260517090000_create_notification_center_tables');
          await notifCenterSchema.up(db);
        }
      }
    }
    // Approval workflow schema repair (idempotent)
    const { ensureApprovalSchema } = require('./utils/approvalSchemaRepair');
    await ensureApprovalSchema(db);

    console.log('--- SCHEMA REPAIR ENGINE: CHECK COMPLETE ---');

    // 1.6 Auto-seed missing email templates (idempotent — only inserts what's missing)
    try {
      const hasTemplatesTable = await db.schema.hasTable('email_templates');
      if (hasTemplatesTable) {
        const requiredNames = [
          'expense_request_admin',
          'expense_status_update',
          'liquidation_approval_request',
          'liquidation_approved_requester',
          'liquidation_declined_requester',
          'fund_replenished'
        ];
        const existing = await db('email_templates').select('name');
        const existingNames = new Set(existing.map(r => r.name));
        const missing = requiredNames.filter(n => !existingNames.has(n));

        if (missing.length > 0) {
          console.log(`TEMPLATE SEED: ${missing.length} missing template(s) detected: ${missing.join(', ')}`);
          // Re-run the seed file which inserts ALL templates (safe — duplicates handled by seed)
          const seedModule = require('./db/seeds/03_email_templates');
          await seedModule.seed(db);
          console.log('TEMPLATE SEED: All email templates synced successfully');
        }
      }
    } catch (tplErr) {
      console.warn('Template auto-seed skipped:', tplErr.message);
    }

    // 1.7 SMTP connection diagnostic
    try {
      const { verifyConnection, getSmtpConfig } = require('./services/emailService');
      const smtpCfg = getSmtpConfig();
      if (smtpCfg.host) {
        const smtpOk = await verifyConnection();
        if (smtpOk) {
          console.log(`[SMTP] ✓ Connection verified to ${smtpCfg.host}`);
        } else {
          console.error(`[SMTP] ✗ Connection FAILED to ${smtpCfg.host} — check SMTP_HOST, SMTP_USER, SMTP_PASS in .env`);
          if (smtpCfg.host && smtpCfg.host.includes('gmail')) {
            console.error('[SMTP] ⚠ WARNING: SMTP_HOST is set to Gmail! This project uses Hostinger SMTP.');
            console.error('[SMTP] Fix: Set SMTP_HOST=smtp.hostinger.com in /home/u335953510/domains/pc.nkbmanufacturing.com/nodejs/.env');
          }
        }
      } else {
        console.warn('[SMTP] ⚠ SMTP_HOST not set in .env — email features disabled');
      }
    } catch (smtpErr) {
      console.warn('[SMTP] Diagnostic skipped:', smtpErr.message);
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
app.use('/api/approval', require('./routes/approval'));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Serve Frontend in Production
const frontendPath = path.join(__dirname, '../dist');
const indexPath = path.join(frontendPath, 'index.html');

// Serve User Manual explicitly (before SPA catch-all)
app.get('/USER_MANUAL.md', (req, res) => {
  const manualPath = path.join(frontendPath, 'USER_MANUAL.md');
  if (fs.existsSync(manualPath)) {
    res.setHeader('Content-Type', 'text/markdown; charset=UTF-8');
    res.sendFile(manualPath);
  } else {
    res.status(404).type('text/plain').send('User manual not found');
  }
});

if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath, {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=UTF-8');
      }
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
  console.log('Serving frontend from:', frontendPath);
} else {
  console.warn('Frontend dist folder not found at:', frontendPath);
}

app.get(/.*/, (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Route Not Found' });
  }

  // Missing static assets must NOT return index.html (causes MIME type errors)
  if (req.originalUrl.startsWith('/assets/')) {
    return res.status(404).type('text/plain').send('Asset not found');
  }
  
  if (fs.existsSync(indexPath)) {
    // Explicitly prevent index.html from ever being cached by proxy layers or browsers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
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
