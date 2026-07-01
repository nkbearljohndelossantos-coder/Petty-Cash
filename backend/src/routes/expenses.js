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
  ['.jpg', ['image/jpeg']],
  ['.jpeg', ['image/jpeg']],
  ['.png', ['image/png']],
  ['.pdf', ['application/pdf']],
  ['.doc', ['application/msword']],
  ['.docx', ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']],
  ['.xls', ['application/vnd.ms-excel']],
  ['.xlsx', ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']],
  ['.csv', ['text/csv', 'application/csv', 'application/vnd.ms-excel']]
]);

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
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimeTypes = allowedAttachmentTypes.get(ext);
    if (allowedMimeTypes && allowedMimeTypes.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only PDF, Word, Excel, CSV, JPG, and PNG attachments are allowed.'));
  }
});

const uploadAttachments = (req, res, next) => {
  upload.array('attachments', 5)(req, res, (err) => {
    if (!err) return next();
    const message = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
      ? 'Each attachment must be 10MB or smaller.'
      : (err.message || 'Attachment upload failed.');
    return res.status(400).json({ success: false, message });
  });
};

router.use(protect);

router.get('/', getExpenses);
router.get('/:id', getExpense);
router.post('/', uploadAttachments, createExpense);
router.put('/:id', authorize('Super Admin', 'Accounting', 'Manager'), updateExpense);
router.patch('/:id/status', authorize('Super Admin', 'Accounting', 'Manager'), updateStatus);
router.delete('/:id', authorize('Super Admin'), deleteExpense);

module.exports = router;
