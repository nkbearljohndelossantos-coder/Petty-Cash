const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { lookupEmployee } = require('../controllers/integrationController');

router.use(protect);
router.get('/employees/:idOrBarcode', lookupEmployee);

module.exports = router;
