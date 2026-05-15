const express = require('express');
const router = express.Router();
const { getCategories, createCategory } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getCategories);
router.post('/', protect, authorize('Super Admin', 'Accounting'), createCategory);

module.exports = router;
