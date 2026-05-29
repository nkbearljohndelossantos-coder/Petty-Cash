const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, departmentController.getDepartments);
router.post('/', protect, authorize('Super Admin', 'Accounting'), departmentController.createDepartment);
router.put('/:id', protect, authorize('Super Admin', 'Accounting'), departmentController.updateDepartment);
router.delete('/:id', protect, authorize('Super Admin', 'Accounting'), departmentController.deleteDepartment);

module.exports = router;
