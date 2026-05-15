const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [totalExpenses] = await db('expenses').sum('amount as total').whereNot('status', 'Rejected');
    const [dailyExpenses] = await db('expenses').sum('amount as total').where('date', today).whereNot('status', 'Rejected');
    const [monthlyExpenses] = await db('expenses').sum('amount as total').where('date', '>=', firstDayOfMonth).whereNot('status', 'Rejected');
    const [pendingApproval] = await db('expenses').count('id as total').where('status', 'Pending');
    const [pendingLiquidation] = await db('expenses').count('id as total').where('status', 'Approved');
    
    // Top category
    const topCategory = await db('expenses')
      .join('categories', 'expenses.category_id', 'categories.id')
      .select('categories.name')
      .sum('amount as total')
      .groupBy('categories.name')
      .orderBy('total', 'desc')
      .first();

    const recentExpenses = await db('expenses')
      .join('categories', 'expenses.category_id', 'categories.id')
      .join('departments', 'expenses.department_id', 'departments.id')
      .select('expenses.*', 'categories.name as category_name', 'departments.name as department_name')
      .orderBy('expenses.created_at', 'desc')
      .limit(5);

    const departmentBreakdown = await db('expenses')
      .join('departments', 'expenses.department_id', 'departments.id')
      .select('departments.name')
      .sum('amount as total')
      .whereNot('status', 'Rejected')
      .groupBy('departments.name')
      .orderBy('total', 'desc')
      .limit(3);

    const [totalFunds] = await db('funds').sum('amount as total');
    const availableBalance = (parseFloat(totalFunds.total) || 0) - (parseFloat(totalExpenses.total) || 0);

    res.json({
      success: true,
      data: {
        totalExpenses: parseFloat(totalExpenses.total || 0),
        dailyExpenses: parseFloat(dailyExpenses.total || 0),
        monthlyExpenses: parseFloat(monthlyExpenses.total || 0),
        availableBalance,
        pendingApproval: parseInt(pendingApproval.total || 0),
        pendingLiquidation: parseInt(pendingLiquidation.total || 0),
        topCategory: topCategory ? topCategory.name : 'N/A',
        recentExpenses,
        departmentBreakdown: departmentBreakdown.map(d => ({ ...d, total: parseFloat(d.total) }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getExpenseTrends = async (req, res) => {
  try {
    const { range } = req.query;
    const days = range === 'historical' ? 365 : 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rawTrends = await db('expenses')
      .join('categories', 'expenses.category_id', 'categories.id')
      .select('expenses.date', 'categories.name as category')
      .sum('amount as total')
      .where('expenses.date', '>=', startDate.toISOString().split('T')[0])
      .groupBy('expenses.date', 'categories.name')
      .orderBy('expenses.date', 'asc');

    // Pivot data for Recharts: [{ date, total, CAT1: val, CAT2: val }, ...]
    const pivotedData = rawTrends.reduce((acc, curr) => {
      const dateStr = new Date(curr.date).toISOString().split('T')[0];
      let existing = acc.find(item => item.date === dateStr);
      if (!existing) {
        existing = { date: dateStr, total: 0 };
        acc.push(existing);
      }
      const val = parseFloat(curr.total);
      existing[curr.category] = val;
      existing.total += val;
      return acc;
    }, []);

    res.json({ success: true, data: pivotedData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCategoryBreakdown = async (req, res) => {
  try {
    const breakdown = await db('expenses')
      .join('categories', 'expenses.category_id', 'categories.id')
      .select('categories.name')
      .sum('amount as total')
      .groupBy('categories.name')
      .orderBy('total', 'desc');

    const formatted = breakdown.map(item => ({
      ...item,
      total: parseFloat(item.total || 0)
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDepartmentBreakdown = async (req, res) => {
  try {
    const breakdown = await db('expenses')
      .join('departments', 'expenses.department_id', 'departments.id')
      .select('departments.name')
      .sum('amount as total')
      .groupBy('departments.name')
      .orderBy('total', 'desc');

    const formatted = breakdown.map(item => ({
      ...item,
      total: parseFloat(item.total || 0)
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
