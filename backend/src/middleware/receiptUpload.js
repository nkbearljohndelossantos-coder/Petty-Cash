const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const RECEIPT_ROOT = path.resolve(__dirname, '../../storage/receipts');
const ALLOWED_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['application/pdf', '.pdf']
]);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const now = new Date();
    const folder = path.join(
      RECEIPT_ROOT,
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, '0')
    );
    fs.mkdir(folder, { recursive: true }, (err) => cb(err, folder));
  },
  filename(req, file, cb) {
    const extension = ALLOWED_TYPES.get(file.mimetype);
    cb(null, `${crypto.randomUUID()}${extension}`);
  }
});

const receiptUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter(req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();
    const expectedExtension = ALLOWED_TYPES.get(file.mimetype);
    if (!expectedExtension || !['.jpg', '.jpeg', '.png', '.pdf'].includes(extension)) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'receipts'));
    }
    cb(null, true);
  }
});

module.exports = { receiptUpload, RECEIPT_ROOT };
