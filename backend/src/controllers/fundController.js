const db = require('../config/db');
const { dispatchNotification } = require('../services/notificationDispatcher');
const { broadcast } = require('../services/socketService');

exports.getFunds = async (req, res) => {
  try {
    const funds = await db('funds')
      .leftJoin('users', 'funds.added_by', 'users.id')
      .select('funds.*', 'users.full_name as adder_name')
      .orderBy('funds.date', 'desc');
    res.json({ success: true, data: funds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addFund = async (req, res) => {
  try {
    const { amount, reference_no, remarks, date } = req.body;
    const [id] = await db('funds').insert({
      amount,
      reference_no,
      remarks,
      date: date || db.fn.now(),
      added_by: req.user.id
    });

    const fund = await db('funds').where({ id }).first();

    await db('activity_logs').insert({
      user_id: req.user.id,
      action: 'ADD_FUND',
      details: `Added PHP ${amount} to petty cash fund`,
      ip_address: req.ip
    });

    // Notify Admins about replenishment
    const admins = await db('users').whereIn('role', ['Super Admin', 'Accounting']).select('id');
    for (const admin of admins) {
      await dispatchNotification(admin.id, {
        title: 'Fund Replenished',
        message: `Petty Cash fund has been replenished with ₱${amount}.`,
        type: 'success',
        link: '/funds',
        templateName: 'fund_replenished'
      });
    }

    // Broadcast real-time balance update
    broadcast('balance_updated', { type: 'FUND_ADDED', amount });

    res.status(201).json({ success: true, data: fund });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteFund = async (req, res) => {
  try {
    const { id } = req.params;
    const fund = await db('funds').where({ id }).first();
    if (!fund) {
      return res.status(404).json({ success: false, message: 'Fund entry not found' });
    }

    await db('funds').where({ id }).del();

    await db('activity_logs').insert({
      user_id: req.user.id,
      action: 'DELETE_FUND',
      details: `Removed fund entry #${id} (PHP ${fund.amount})`,
      ip_address: req.ip
    });

    broadcast('balance_updated', { type: 'FUND_DELETED', id });

    res.json({ success: true, message: 'Fund entry deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const totalInResult = await db('funds').sum('amount as total').first();
    const totalOutResult = await db('expenses')
      .whereIn('status', ['Approved', 'Liquidated'])
      .sum('amount as total')
      .first();

    const totalIn = parseFloat(totalInResult?.total) || 0;
    const totalOut = parseFloat(totalOutResult?.total) || 0;
    const balance = totalIn - totalOut;

    res.json({ 
      success: true, 
      data: {
        balance,
        totalIn,
        totalOut
      }
    });
  } catch (err) {
    console.error('getBalance Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
