const express = require('express');
const router = express.Router();
const notifCenterController = require('../controllers/notificationCenterController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// User Inbox Endpoints
router.get('/', notifCenterController.getNotifications);
router.put('/:id/read', notifCenterController.markAsRead);
router.put('/read-all', notifCenterController.markAllAsRead);
router.put('/:id/acknowledge', notifCenterController.acknowledgeNotification);
router.put('/:id/archive', notifCenterController.archiveNotification);

// Administrative Endpoints
router.post('/broadcast', authorize('Super Admin', 'Accounting'), notifCenterController.broadcastNotification);
router.get('/sent', authorize('Super Admin', 'Accounting'), notifCenterController.getSentNotifications);

module.exports = router;
