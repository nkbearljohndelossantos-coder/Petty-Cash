const express = require('express');
const router = express.Router();
const { getDashboardStats, getExpenseTrends, getCategoryBreakdown, getDepartmentBreakdown } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/stats', getDashboardStats);
router.get('/trends', getExpenseTrends);
router.get('/categories', getCategoryBreakdown);
router.get('/departments', getDepartmentBreakdown);

module.exports = router;
