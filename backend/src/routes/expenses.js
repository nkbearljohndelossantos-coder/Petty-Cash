const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
  getExpenses, 
  getExpense, 
  createExpense, 
  updateExpense, 
  deleteExpense,
  updateStatus
} = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Images and PDFs only!');
    }
  }
});

router.use(protect);

router.get('/', getExpenses);
router.get('/:id', getExpense);
router.post('/', upload.array('attachments', 5), createExpense);
router.put('/:id', authorize('Super Admin', 'Accounting', 'Manager'), updateExpense);
router.patch('/:id/status', authorize('Super Admin', 'Accounting', 'Manager'), updateStatus);
router.delete('/:id', authorize('Super Admin', 'Accounting'), deleteExpense);

module.exports = router;
