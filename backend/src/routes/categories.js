const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getCategories);
router.post('/', protect, authorize('Super Admin', 'Accounting'), createCategory);
router.put('/:id', protect, authorize('Super Admin', 'Accounting'), updateCategory);
router.delete('/:id', protect, authorize('Super Admin', 'Accounting'), deleteCategory);

module.exports = router;
