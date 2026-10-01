const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const payableController = require('../controllers/payableController');
const { protect, authorize } = require('../middleware/auth');

// Multer storage for payable attachments
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `payable-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Public / Tokenized Action Endpoint (No protect middleware required, validated via token)
router.get('/approval/action', payableController.processApprovalAction);

// All following routes require JWT protection
router.use(protect);

// 1. Get & Create
router.get('/', payableController.getPayables);
router.get('/:id', payableController.getPayableById);
router.post('/', upload.array('attachments', 10), payableController.createPayable);
router.put('/:id', upload.array('attachments', 10), payableController.updatePayable);

// 2. Approvals & Rejections
router.put('/:id/approve', authorize('Super Admin', 'COO', 'Manager', 'Accounting'), payableController.approvePayable);
router.put('/:id/reject', authorize('Super Admin', 'COO', 'Manager', 'Accounting'), payableController.rejectPayable);

// 3. COO Confirmation & Clearing
router.put('/:id/confirm', authorize('Super Admin', 'COO'), payableController.cooConfirmPayable);

// 4. Cheque Issuance & Bank Clearing (Accounting / Treasury)
router.post('/:id/cheque', authorize('Super Admin', 'COO', 'Accounting'), payableController.issueCheque);
router.put('/:id/clear', authorize('Super Admin', 'COO', 'Accounting'), payableController.markCleared);

// 5. Approval Relay (Generates tokenized webhook/email approval link)
router.post('/:id/relay-approval', authorize('Super Admin', 'COO', 'Manager', 'Accounting'), payableController.relayApproval);

module.exports = router;
