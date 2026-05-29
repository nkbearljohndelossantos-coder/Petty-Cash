const express = require('express');
const router = express.Router();
const fundController = require('../controllers/fundController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('Super Admin'), fundController.getFunds);
router.post('/', authorize('Super Admin'), fundController.addFund);
router.delete('/:id', authorize('Super Admin'), fundController.deleteFund);
router.get('/balance', fundController.getBalance);

module.exports = router;
