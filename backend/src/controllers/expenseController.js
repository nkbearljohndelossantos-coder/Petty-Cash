const db = require('../config/db');
const { logActivity } = require('../utils/logService');
const { dispatchNotification } = require('../services/notificationDispatcher');
const { broadcast } = require('../services/socketService');

exports.getExpenses = async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search = '', 
    category, 
    department, 
    status, 
    startDate, 
    endDate,
    requestedBy
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let query = db('expenses')
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .leftJoin('departments', 'expenses.department_id', 'departments.id')
      .leftJoin('users', 'expenses.created_by', 'users.id')
      .select(
        'expenses.*',
        'categories.name as category_name',
        'departments.name as department_name',
        'users.full_name as creator_name'
      );

    // Filters
    if (search) {
      query = query.where('expenses.remarks', 'like', `%${search}%`)
        .orWhere('expenses.requested_by', 'like', `%${search}%`);
    }

    if (category) query = query.where('expenses.category_id', category);
    if (department) query = query.where('expenses.department_id', department);
    if (status) query = query.where('expenses.status', status);
    if (requestedBy) query = query.where('expenses.requested_by', 'like', `%${requestedBy}%`);
    
    if (startDate && endDate) {
      query = query.whereBetween('expenses.date', [startDate, endDate]);
    }

    // Pagination
    const countQuery = db('expenses').count('id as total').first();
    // Copy filters to countQuery if needed, but for simplicity:
    const totalCount = await db('expenses').count('id as total').first();

    const expenses = await query
      .orderBy('expenses.date', 'desc')
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        total: parseInt(totalCount.total),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getExpense = async (req, res) => {
  try {
    const expense = await db('expenses')
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .leftJoin('departments', 'expenses.department_id', 'departments.id')
      .select('expenses.*', 'categories.name as category_name', 'departments.name as department_name')
      .where('expenses.id', req.params.id)
      .first();

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const attachments = await db('expense_attachments').where({ expense_id: expense.id });

    res.json({ success: true, data: { ...expense, attachments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const { date, category_id, remarks, requested_by, department_id, amount, status, quantity, unit } = req.body;

    const [expenseId] = await db('expenses').insert({
      date,
      category_id: category_id || null,
      remarks,
      requested_by,
      department_id: department_id || null,
      amount,
      quantity: quantity || 1,
      unit: unit || 'Piece',
      status: status || 'Pending',
      created_by: req.user.id
    });

    const expense = await db('expenses').where({ id: expenseId }).first();

    // Handle attachments if any (multer will handle files)
    if (req.files && req.files.length > 0) {
      const attachments = req.files.map(file => ({
        expense_id: expense.id,
        file_path: file.path,
        file_name: file.originalname,
        file_type: file.mimetype
      }));
      await db('expense_attachments').insert(attachments);
    }

    await db('activity_logs').insert({
      user_id: req.user.id,
      action: 'CREATE_EXPENSE',
      details: `Created expense with ID ${expense.id}`,
      ip_address: req.ip
    });

    // Notify Admins
    const admins = await db('users').whereIn('role', ['Super Admin', 'Accounting']).select('id');
    for (const admin of admins) {
      await dispatchNotification(admin.id, {
        title: 'New Expense Request',
        message: `A new expense request for ₱${amount} has been submitted by ${requested_by}.`,
        type: 'approval',
        link: `/expenses?id=${expense.id}`,
        templateName: 'expense_request_admin'
      });
    }

    // Broadcast real-time balance update if it affects funds (Direct Approval)
    if (status === 'Approved') {
      broadcast('balance_updated', { type: 'EXPENSE_CREATED', amount });
    }

    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, category_id, remarks, requested_by, department_id, amount, status, quantity, unit } = req.body;

    await db('expenses')
      .where({ id })
      .update({
        date,
        category_id: category_id || null,
        remarks,
        requested_by,
        department_id: department_id || null,
        amount,
        quantity,
        unit,
        status,
        updated_at: db.fn.now()
      });

    const updatedExpense = await db('expenses').where({ id }).first();

    if (!updatedExpense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await db('activity_logs').insert({
      user_id: req.user.id,
      action: 'UPDATE_EXPENSE',
      details: `Updated expense with ID ${id}`,
      ip_address: req.ip
    });

    // Always broadcast on update just in case amount or status changed
    broadcast('balance_updated', { type: 'EXPENSE_UPDATED' });

    res.json({ success: true, data: updatedExpense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if it exists
    const expense = await db('expenses').where({ id }).first();
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await db('expenses').where({ id }).del();

    await db('activity_logs').insert({
      user_id: req.user.id,
      action: 'DELETE_EXPENSE',
      details: `Deleted expense with ID ${id}`,
      ip_address: req.ip
    });

    // Broadcast since balance might have been restored if it was approved
    broadcast('balance_updated', { type: 'EXPENSE_DELETED' });

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db('expenses')
      .where({ id })
      .update({
        status,
        updated_at: db.fn.now()
      });

    const updatedExpense = await db('expenses').where({ id }).first();

    if (!updatedExpense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await db('activity_logs').insert({
      user_id: req.user.id,
      action: 'UPDATE_STATUS',
      details: `Updated expense ID ${id} status to ${status}`,
      ip_address: req.ip
    });

    // Notify Creator
    if (updatedExpense.created_by) {
      await dispatchNotification(updatedExpense.created_by, {
        title: `Expense ${status}`,
        message: `Your expense request for ₱${updatedExpense.amount} has been ${status.toLowerCase()}.`,
        type: status === 'Approved' ? 'success' : (status === 'Rejected' ? 'error' : 'info'),
        link: `/expenses?id=${id}`,
        templateName: 'expense_status_update'
      });
    }

    // Broadcast real-time balance update if status affects balance
    if (['Approved', 'Rejected', 'Liquidated'].includes(status)) {
      broadcast('balance_updated', { type: 'STATUS_UPDATED', status });
    }

    res.json({ success: true, data: updatedExpense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
