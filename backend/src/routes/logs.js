const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('Super Admin'), logController.getLogs);

module.exports = router;
