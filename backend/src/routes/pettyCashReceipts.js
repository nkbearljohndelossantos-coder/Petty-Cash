const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { receiptUpload } = require('../middleware/receiptUpload');
const controller = require('../controllers/receiptController');

const router = express.Router();
router.use(protect);
router.post('/upload', receiptUpload.array('receipts', 10), controller.uploadReceipts);
router.get('/transaction/:transactionId', controller.listReceipts);
router.get('/:id/view', controller.viewReceipt);
router.get('/:id/download', controller.downloadReceipt);
router.delete('/:id', controller.deleteReceipt);
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Receipt files must be 10MB or smaller.'
      : 'Only JPG, JPEG, PNG, and PDF receipt files are allowed.';
    return res.status(400).json({ success: false, message });
  }
  next(err);
});

module.exports = router;
