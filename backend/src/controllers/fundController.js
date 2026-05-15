const db = require('../config/db');
const { dispatchNotification } = require('../services/notificationDispatcher');

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

    res.status(201).json({ success: true, data: fund });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const totalIn = await db('funds').sum('amount as total').first();
    const totalOut = await db('expenses')
      .whereIn('status', ['Approved', 'Liquidated'])
      .sum('amount as total')
      .first();

    const balance = (parseFloat(totalIn.total) || 0) - (parseFloat(totalOut.total) || 0);

    res.json({ 
      success: true, 
      data: {
        balance,
        totalIn: parseFloat(totalIn.total) || 0,
        totalOut: parseFloat(totalOut.total) || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
