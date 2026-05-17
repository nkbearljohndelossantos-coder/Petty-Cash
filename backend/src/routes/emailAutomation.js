const express = require('express');
const router = express.Router();
const notifCenterController = require('../controllers/notificationCenterController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('Super Admin', 'Accounting'));

// Notification Templates
router.get('/templates', notifCenterController.getTemplates);
router.post('/templates', notifCenterController.createTemplate);
router.put('/templates/:id', notifCenterController.updateTemplate);
router.delete('/templates/:id', notifCenterController.deleteTemplate);

// Notification Schedules (node-cron mapping)
router.get('/schedules', notifCenterController.getSchedules);
router.post('/schedules', notifCenterController.createSchedule);
router.delete('/schedules/:id', notifCenterController.deleteSchedule);

// Repurpose legacy email logs to show sent notifications and read-tracking metrics
router.get('/logs', notifCenterController.getSentNotifications);

module.exports = router;
