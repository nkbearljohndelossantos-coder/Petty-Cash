const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSettings,
  updateSettings,
  listApprovers,
  addApprover,
  updateApprover,
  deleteApprover,
  verifyToken,
  approveByToken,
  declineByToken,
  getAuditTrail,
  getEmailHealth,
  sendApprovalEmailHandler,
  sendReminder
} = require('../controllers/approvalController');

// Public token-based routes (no login required)
router.get('/token/:token', verifyToken);
router.post('/approve/:token', approveByToken);
router.post('/decline/:token', declineByToken);

// Protected admin routes
router.use(protect);

router.get('/settings', authorize('Super Admin'), getSettings);
router.put('/settings', authorize('Super Admin'), updateSettings);

router.get('/approvers', authorize('Super Admin'), listApprovers);
router.post('/approvers', authorize('Super Admin'), addApprover);
router.put('/approvers/:id', authorize('Super Admin'), updateApprover);
router.delete('/approvers/:id', authorize('Super Admin'), deleteApprover);

router.get('/audit/:expenseId', getAuditTrail);
router.get('/email-health', authorize('Super Admin'), getEmailHealth);

// Send approval email (protected – any authenticated user can trigger)
router.post('/send-approval', sendApprovalEmailHandler);

// Send reminder to approver (Staff, Accounting, Super Admin, Manager)
router.post('/remind/:expenseId', authorize('Staff', 'Accounting', 'Super Admin', 'Manager'), sendReminder);

module.exports = router;
