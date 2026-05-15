const express = require('express');
const router = express.Router();
const fundController = require('../controllers/fundController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', fundController.getFunds);
router.post('/', fundController.addFund);
router.get('/balance', fundController.getBalance);

module.exports = router;
