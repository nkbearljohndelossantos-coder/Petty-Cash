const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middleware/auth');
const ExcelJS = require('exceljs');

router.use(protect);

router.get('/export-excel', async (req, res) => {
  try {
    const { startDate, endDate, categoryId, departmentId } = req.query;

    let query = db('expenses')
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .leftJoin('departments', 'expenses.department_id', 'departments.id')
      .select(
        'expenses.id',
        'expenses.date',
        'categories.name as category',
        'expenses.remarks',
        'expenses.requested_by',
        'departments.name as department',
        'expenses.amount',
        'expenses.quantity',
        'expenses.unit',
        'expenses.status'
      );

    if (startDate) query = query.where('expenses.date', '>=', startDate);
    if (endDate) query = query.where('expenses.date', '<=', endDate);
    if (categoryId) query = query.where('expenses.category_id', categoryId);
    if (departmentId) query = query.where('expenses.department_id', departmentId);

    const expenses = await query.orderBy('expenses.date', 'desc');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expenses Report');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Requested By', key: 'requested_by', width: 20 },
      { header: 'Remarks', key: 'remarks', width: 40 },
      { header: 'Qty', key: 'quantity', width: 10 },
      { header: 'Unit', key: 'unit', width: 15 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    expenses.forEach(exp => {
      worksheet.addRow({
        ...exp,
        date: new Date(exp.date).toLocaleDateString(),
        amount: parseFloat(exp.amount)
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=NKB_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = db('expenses').whereNot('status', 'Rejected');
    if (startDate) query = query.where('date', '>=', startDate);
    if (endDate) query = query.where('date', '<=', endDate);

    const [summary] = await query.sum('amount as total_spent').count('id as total_count');
    
    const categorySummary = await db('expenses')
      .join('categories', 'expenses.category_id', 'categories.id')
      .select('categories.name')
      .sum('amount as total')
      .whereNot('status', 'Rejected')
      .groupBy('categories.name');

    const departmentSummary = await db('expenses')
      .join('departments', 'expenses.department_id', 'departments.id')
      .select('departments.name')
      .sum('amount as total')
      .whereNot('status', 'Rejected')
      .groupBy('departments.name');

    res.json({ success: true, data: { ...summary, categorySummary, departmentSummary } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
