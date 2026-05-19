const express = require('express');
const router = express.Router();
const notifCenterController = require('../controllers/notificationCenterController');
const notifController = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Prevent caching of notification responses
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// User Inbox Endpoints
router.get('/', notifCenterController.getNotifications);
router.put('/:id/read', notifCenterController.markAsRead);
router.put('/read-all', notifCenterController.markAllAsRead);
router.put('/:id/acknowledge', notifCenterController.acknowledgeNotification);
router.put('/:id/archive', notifCenterController.archiveNotification);

// User Notification Preference Endpoints
router.get('/preferences', notifController.getPreferences);
router.put('/preferences', notifController.updatePreferences);

// Administrative Endpoints
router.post('/broadcast', authorize('Super Admin', 'Accounting'), notifCenterController.broadcastNotification);
router.get('/sent', authorize('Super Admin', 'Accounting'), notifCenterController.getSentNotifications);

module.exports = router;
