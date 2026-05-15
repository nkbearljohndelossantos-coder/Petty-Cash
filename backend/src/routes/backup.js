const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/auth');
const { exportBackup, restoreBackup } = require('../controllers/backupController');

// Multer config for temporary storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `restore-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.xlsx') {
      return cb(new Error('Only .xlsx files are allowed'));
    }
    cb(null, true);
  }
});

router.get('/export', protect, authorize('Super Admin'), exportBackup);
router.post('/import', protect, authorize('Super Admin'), upload.single('backup'), restoreBackup);

module.exports = router;
