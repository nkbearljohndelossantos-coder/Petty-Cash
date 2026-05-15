const express = require('express');
const router = express.Router();
const emailAutomationController = require('../controllers/emailAutomationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('Super Admin', 'Accounting'));

// Templates
router.get('/templates', emailAutomationController.getTemplates);
router.post('/templates', emailAutomationController.createTemplate);
router.put('/templates/:id', emailAutomationController.updateTemplate);

// Logs
router.get('/logs', emailAutomationController.getEmailLogs);

// Schedules
router.get('/schedules', emailAutomationController.getScheduledEmails);

module.exports = router;
