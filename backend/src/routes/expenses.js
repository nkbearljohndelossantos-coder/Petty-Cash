const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  getExpenses, 
  getExpense, 
  createExpense, 
  updateExpense, 
  deleteExpense,
  updateStatus
} = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');

const allowedAttachmentTypes = new Map([
  ['.jpg', ['image/jpeg', 'image/pjpeg']],
  ['.jpeg', ['image/jpeg', 'image/pjpeg']],
  ['.png', ['image/png', 'image/x-png']],
  ['.pdf', ['application/pdf']],
  ['.doc', ['application/msword', 'application/octet-stream']],
  [
    '.docx',
    [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream'
    ]
  ],
  ['.xls', ['application/vnd.ms-excel', 'application/octet-stream']],
  [
    '.xlsx',
    [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream'
    ]
  ],
  ['.csv', ['text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel', 'application/octet-stream']]
]);

const isAllowedAttachment = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = allowedAttachmentTypes.get(ext);
  if (!allowedMimeTypes) return false;

  // Some browsers and hosting proxies report Office/CSV files as generic binary
  // uploads. Keep the extension allow-list as the main guard so valid vouchers
  // are not blocked by MIME sniffing differences.
  return !file.mimetype || allowedMimeTypes.includes(file.mimetype);
};

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync('uploads', { recursive: true });
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (isAllowedAttachment(file)) return cb(null, true);
    cb(new Error('Only PDF, Word, Excel, CSV, JPG, and PNG attachments are allowed.'));
  }
});

const uploadAttachments = (req, res, next) => {
  upload.array('attachments', 5)(req, res, (err) => {
    if (!err) return next();
    let message = err.message || 'Attachment upload failed.';

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'Each attachment must be 10MB or smaller.';
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
        message = 'You can upload up to 5 attachments only.';
      }
    }

    console.warn('Expense attachment upload rejected:', {
      code: err.code,
      field: err.field,
      message: err.message
    });
    return res.status(400).json({ success: false, message });
  });
};

router.use(protect);

router.get('/', getExpenses);
router.get('/:id', getExpense);
router.post('/', uploadAttachments, createExpense);
router.put('/:id', authorize('Super Admin', 'Accounting', 'Manager', 'Staff'), updateExpense);
router.patch('/:id/status', authorize('Super Admin', 'Accounting', 'Manager'), updateStatus);
router.delete('/:id', authorize('Super Admin'), deleteExpense);

module.exports = router;
