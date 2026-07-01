const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [totalExpensesResult] = await db('expenses').sum('amount as total').whereNot('status', 'Rejected').catch(() => [{}]);
    const [dailyExpensesResult] = await db('expenses').sum('amount as total').where('date', today).whereNot('status', 'Rejected').catch(() => [{}]);
    const [monthlyExpensesResult] = await db('expenses').sum('amount as total').where('date', '>=', firstDayOfMonth).whereNot('status', 'Rejected').catch(() => [{}]);
    const [pendingApprovalResult] = await db('expenses').count('id as total').whereIn('status', ['Pending', 'For Approval']).catch(() => [{}]);
    const [pendingLiquidationResult] = await db('expenses').count('id as total').where('status', 'Approved').catch(() => [{}]);
    
    const totalExpenses = parseFloat(totalExpensesResult?.total) || 0;
    const dailyExpenses = parseFloat(dailyExpensesResult?.total) || 0;
    const monthlyExpenses = parseFloat(monthlyExpensesResult?.total) || 0;
    const pendingApproval = parseInt(pendingApprovalResult?.total) || 0;
    const pendingLiquidation = parseInt(pendingLiquidationResult?.total) || 0;

    // Top category
    const topCategory = await db('expenses')
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .select('categories.name')
      .sum('amount as total')
      .groupBy('categories.name')
      .orderBy('total', 'desc')
      .first().catch(() => null);

    const recentExpenses = await db('expenses')
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .leftJoin('departments', 'expenses.department_id', 'departments.id')
      .leftJoin('users as requester', 'expenses.user_id', 'requester.id')
      .select(
        'expenses.*', 
        db.raw('COALESCE(categories.name, ?) as category_name', ['Uncategorized']),
        db.raw('COALESCE(departments.name, ?) as department_name', ['Unassigned']),
        db.raw('COALESCE(requester.full_name, ?) as requested_by', ['Unknown User'])
      )
      .orderBy('expenses.created_at', 'desc')
      .limit(5).catch(() => []);

    const departmentBreakdown = await db('expenses')
      .leftJoin('departments', 'expenses.department_id', 'departments.id')
      .select('departments.name')
      .sum('amount as total')
      .whereNot('status', 'Rejected')
      .groupBy('departments.name')
      .orderBy('total', 'desc')
      .limit(3).catch(() => []);

    const [totalFundsResult] = await db('funds').sum('amount as total').catch(() => [{}]);
    const totalFunds = parseFloat(totalFundsResult?.total) || 0;
    const availableBalance = totalFunds - totalExpenses;

    res.json({
      success: true,
      data: {
        totalExpenses,
        dailyExpenses,
        monthlyExpenses,
        availableBalance,
        pendingApproval,
        pendingLiquidation,
        topCategory: topCategory?.name || 'N/A',
        recentExpenses,
        departmentBreakdown: departmentBreakdown.map(d => ({ 
          name: d.name || 'Unassigned',
          total: parseFloat(d.total || 0) 
        }))
      }
    });
  } catch (err) {
    console.error('getDashboardStats Error:', err.message);
    res.json({
      success: true,
      data: {
        totalExpenses: 0,
        dailyExpenses: 0,
        monthlyExpenses: 0,
        availableBalance: 0,
        pendingApproval: 0,
        pendingLiquidation: 0,
        topCategory: 'N/A',
        recentExpenses: [],
        departmentBreakdown: []
      }
    });
  }
};

exports.getExpenseTrends = async (req, res) => {
  try {
    const { range } = req.query;
    const days = range === 'historical' ? 365 : 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rawTrends = await db('expenses')
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .select('expenses.date', 'categories.name as category')
      .sum('amount as total')
      .where('expenses.date', '>=', startDate.toISOString().split('T')[0])
      .groupBy('expenses.date', 'categories.name')
      .orderBy('expenses.date', 'asc')
      .catch(() => []);

    // Pivot data for Recharts: [{ date, total, CAT1: val, CAT2: val }, ...]
    const pivotedData = rawTrends.reduce((acc, curr) => {
      const dateStr = new Date(curr.date).toISOString().split('T')[0];
      let existing = acc.find(item => item.date === dateStr);
      if (!existing) {
        existing = { date: dateStr, total: 0 };
        acc.push(existing);
      }
      const val = parseFloat(curr.total);
      const catName = curr.category || 'Uncategorized';
      existing[catName] = val;
      existing.total += val;
      return acc;
    }, []);

    res.json({ success: true, data: pivotedData });
  } catch (err) {
    console.error('getExpenseTrends Error:', err.message);
    res.json({ success: true, data: [] });
  }
};

exports.getCategoryBreakdown = async (req, res) => {
  try {
    const breakdown = await db('expenses')
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .select('categories.name')
      .sum('amount as total')
      .groupBy('categories.name')
      .orderBy('total', 'desc')
      .catch(() => []);

    const formatted = breakdown.map(item => ({
      name: item.name || 'Uncategorized',
      total: parseFloat(item.total || 0)
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('getCategoryBreakdown Error:', err.message);
    res.json({ success: true, data: [] });
  }
};

exports.getDepartmentBreakdown = async (req, res) => {
  try {
    const breakdown = await db('expenses')
      .leftJoin('departments', 'expenses.department_id', 'departments.id')
      .select('departments.name')
      .sum('amount as total')
      .groupBy('departments.name')
      .orderBy('total', 'desc')
      .catch(() => []);

    const formatted = breakdown.map(item => ({
      name: item.name || 'Unassigned',
      total: parseFloat(item.total || 0)
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('getDepartmentBreakdown Error:', err.message);
    res.json({ success: true, data: [] });
  }
};
