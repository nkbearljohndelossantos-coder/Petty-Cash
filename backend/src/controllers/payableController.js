const db = require('../config/db');
const crypto = require('crypto');
const { logActivity } = require('../utils/logService');

// Helper to generate sequential requisition number PR-YYYY-XXXX
async function generateRequisitionNo() {
  const currentYear = new Date().getFullYear();
  const latest = await db('payables')
    .whereRaw('requisition_no LIKE ?', [`PR-${currentYear}-%`])
    .orderBy('id', 'desc')
    .first();

  let nextSeq = 1;
  if (latest && latest.requisition_no) {
    const parts = latest.requisition_no.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }
  }
  return `PR-${currentYear}-${String(nextSeq).padStart(4, '0')}`;
}

// 1. Get list of payables
exports.getPayables = async (req, res) => {
  try {
    const { status, department_id, search, start_date, end_date, page = 1, limit = 50 } = req.query;

    let query = db('payables')
      .leftJoin('departments', 'payables.department_id', 'departments.id')
      .leftJoin('users as requestor', 'payables.user_id', 'requestor.id')
      .leftJoin('users as approver', 'payables.approved_by', 'approver.id')
      .leftJoin('users as coo', 'payables.coo_confirmed_by', 'coo.id')
      .select(
        'payables.*',
        'departments.name as department_name',
        'requestor.full_name as requestor_name',
        'requestor.username as requestor_username',
        'approver.full_name as approver_name',
        'coo.full_name as coo_name'
      );

    // Apply role scoping: Staff can only see their department's payables if not Super Admin/COO/Accounting
    if (req.user && ['Staff', 'Manager'].includes(req.user.role) && req.user.department_id) {
      query = query.where('payables.department_id', req.user.department_id);
    }

    if (status && status !== 'All') {
      query = query.where('payables.status', status);
    }

    if (department_id) {
      query = query.where('payables.department_id', department_id);
    }

    if (start_date) {
      query = query.where('payables.due_date', '>=', start_date);
    }

    if (end_date) {
      query = query.where('payables.due_date', '<=', end_date);
    }

    if (search) {
      const term = `%${search.toLowerCase()}%`;
      query = query.where(function () {
        this.whereRaw('LOWER(payables.requisition_no) LIKE ?', [term])
          .orWhereRaw('LOWER(payables.supplier_name) LIKE ?', [term])
          .orWhereRaw('LOWER(payables.invoice_no) LIKE ?', [term])
          .orWhereRaw('LOWER(payables.remarks) LIKE ?', [term]);
      });
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const payables = await query.orderBy('payables.id', 'desc').limit(parseInt(limit, 10)).offset(offset);

    // Attach attachments and cheque issuances count/summary
    const payableIds = payables.map(p => p.id);
    const attachments = payableIds.length > 0 
      ? await db('payable_attachments').whereIn('payable_id', payableIds)
      : [];
    const cheques = payableIds.length > 0
      ? await db('cheque_issuances').whereIn('payable_id', payableIds)
      : [];

    const enriched = payables.map(p => ({
      ...p,
      attachments: attachments.filter(a => a.payable_id === p.id),
      cheques: cheques.filter(c => c.payable_id === p.id)
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('getPayables error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch payables' });
  }
};

// 2. Get single payable by ID
exports.getPayableById = async (req, res) => {
  try {
    const { id } = req.params;
    const payable = await db('payables')
      .leftJoin('departments', 'payables.department_id', 'departments.id')
      .leftJoin('users as requestor', 'payables.user_id', 'requestor.id')
      .leftJoin('users as approver', 'payables.approved_by', 'approver.id')
      .leftJoin('users as coo', 'payables.coo_confirmed_by', 'coo.id')
      .select(
        'payables.*',
        'departments.name as department_name',
        'requestor.full_name as requestor_name',
        'approver.full_name as approver_name',
        'coo.full_name as coo_name'
      )
      .where('payables.id', id)
      .first();

    if (!payable) {
      return res.status(404).json({ success: false, message: 'Payable requisition not found' });
    }

    const attachments = await db('payable_attachments').where({ payable_id: id });
    const cheques = await db('cheque_issuances')
      .leftJoin('users as issuer', 'cheque_issuances.issued_by', 'issuer.id')
      .select('cheque_issuances.*', 'issuer.full_name as issuer_name')
      .where({ payable_id: id });

    res.json({
      success: true,
      data: {
        ...payable,
        attachments,
        cheques
      }
    });
  } catch (err) {
    console.error('getPayableById error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Create new payable requisition
exports.createPayable = async (req, res) => {
  try {
    const {
      supplier_name,
      invoice_no,
      department_id,
      gross_amount,
      ewt_rate = 0,
      due_date,
      remarks
    } = req.body;

    if (!supplier_name || !gross_amount) {
      return res.status(400).json({ success: false, message: 'Supplier name and Gross amount are required' });
    }

    const gross = parseFloat(gross_amount);
    const rate = parseFloat(ewt_rate) || 0;
    const ewt = parseFloat(((gross * rate) / 100).toFixed(2));
    const net = parseFloat((gross - ewt).toFixed(2));

    const requisition_no = await generateRequisitionNo();

    const [id] = await db('payables').insert({
      requisition_no,
      supplier_name: supplier_name.trim(),
      invoice_no: invoice_no ? invoice_no.trim() : null,
      department_id: department_id ? parseInt(department_id, 10) : (req.user?.department_id || null),
      user_id: req.user?.id || null,
      gross_amount: gross,
      ewt_rate: rate,
      ewt_amount: ewt,
      net_amount: net,
      due_date: due_date || null,
      status: 'Pending Approval',
      remarks: remarks ? remarks.trim() : null
    });

    // Process file attachments
    if (req.files && req.files.length > 0) {
      const attachmentRows = req.files.map(file => ({
        payable_id: id,
        file_name: file.originalname,
        file_path: file.filename,
        file_size: file.size,
        file_type: file.mimetype
      }));
      await db('payable_attachments').insert(attachmentRows);
    }

    await logActivity(req.user?.id, 'CREATE_PAYABLE', `Created Payable Requisition ${requisition_no} for ${supplier_name} - Amount: PHP ${gross}`);

    // Create a notification for COO & Accounting
    const cooUsers = await db('users').whereIn('role', ['Super Admin', 'COO', 'Accounting']);
    for (const u of cooUsers) {
      await db('notifications').insert({
        user_id: u.id,
        title: 'New Cheque Payable Requisition',
        message: `${requisition_no} submitted for ${supplier_name} (PHP ${gross.toLocaleString()})`,
        type: 'payable',
        priority: 'important'
      });
    }

    const created = await db('payables').where({ id }).first();
    res.status(201).json({ success: true, message: 'Payable requisition created successfully', data: created });
  } catch (err) {
    console.error('createPayable error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create payable requisition' });
  }
};

// 4. Update payable requisition
exports.updatePayable = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      supplier_name,
      invoice_no,
      department_id,
      gross_amount,
      ewt_rate,
      due_date,
      remarks
    } = req.body;

    const existing = await db('payables').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Payable not found' });
    }

    if (existing.status === 'Cleared' || existing.status === 'Cheque Issued') {
      return res.status(400).json({ success: false, message: 'Cannot edit payable after cheque has been issued/cleared' });
    }

    const gross = gross_amount !== undefined ? parseFloat(gross_amount) : parseFloat(existing.gross_amount);
    const rate = ewt_rate !== undefined ? parseFloat(ewt_rate) : parseFloat(existing.ewt_rate);
    const ewt = parseFloat(((gross * rate) / 100).toFixed(2));
    const net = parseFloat((gross - ewt).toFixed(2));

    await db('payables').where({ id }).update({
      supplier_name: supplier_name !== undefined ? supplier_name.trim() : existing.supplier_name,
      invoice_no: invoice_no !== undefined ? invoice_no.trim() : existing.invoice_no,
      department_id: department_id !== undefined ? department_id : existing.department_id,
      gross_amount: gross,
      ewt_rate: rate,
      ewt_amount: ewt,
      net_amount: net,
      due_date: due_date !== undefined ? due_date : existing.due_date,
      remarks: remarks !== undefined ? remarks.trim() : existing.remarks,
      updated_at: db.fn.now()
    });

    if (req.files && req.files.length > 0) {
      const attachmentRows = req.files.map(file => ({
        payable_id: id,
        file_name: file.originalname,
        file_path: file.filename,
        file_size: file.size,
        file_type: file.mimetype
      }));
      await db('payable_attachments').insert(attachmentRows);
    }

    await logActivity(req.user?.id, 'UPDATE_PAYABLE', `Updated Payable ${existing.requisition_no}`);

    const updated = await db('payables').where({ id }).first();
    res.json({ success: true, message: 'Payable updated successfully', data: updated });
  } catch (err) {
    console.error('updatePayable error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. In-App Department / Manager Approval
exports.approvePayable = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db('payables').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Payable not found' });
    }

    await db('payables').where({ id }).update({
      status: 'Approved',
      approved_by: req.user.id,
      approved_at: db.fn.now(),
      rejection_reason: null,
      updated_at: db.fn.now()
    });

    await logActivity(req.user.id, 'APPROVE_PAYABLE', `Approved Payable ${existing.requisition_no}`);

    // Notify COO for Confirmation & Clearing
    const cooUsers = await db('users').whereIn('role', ['Super Admin', 'COO']);
    for (const u of cooUsers) {
      await db('notifications').insert({
        user_id: u.id,
        title: 'Payable Ready for COO Confirmation',
        message: `${existing.requisition_no} for ${existing.supplier_name} has been approved and requires COO Confirmation`,
        type: 'payable',
        priority: 'important'
      });
    }

    res.json({ success: true, message: `Payable ${existing.requisition_no} approved successfully` });
  } catch (err) {
    console.error('approvePayable error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Reject Payable
exports.rejectPayable = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason || !rejection_reason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const existing = await db('payables').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Payable not found' });
    }

    await db('payables').where({ id }).update({
      status: 'Rejected',
      rejection_reason: rejection_reason.trim(),
      updated_at: db.fn.now()
    });

    await logActivity(req.user.id, 'REJECT_PAYABLE', `Rejected Payable ${existing.requisition_no} - Reason: ${rejection_reason}`);

    if (existing.user_id) {
      await db('notifications').insert({
        user_id: existing.user_id,
        title: 'Payable Requisition Rejected',
        message: `${existing.requisition_no} was rejected: ${rejection_reason}`,
        type: 'payable',
        priority: 'important'
      });
    }

    res.json({ success: true, message: `Payable ${existing.requisition_no} rejected` });
  } catch (err) {
    console.error('rejectPayable error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 7. COO Confirmation & Clearing
exports.cooConfirmPayable = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db('payables').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Payable not found' });
    }

    await db('payables').where({ id }).update({
      status: 'Confirmed',
      coo_confirmed_by: req.user.id,
      coo_confirmed_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    await logActivity(req.user.id, 'COO_CONFIRM_PAYABLE', `COO Confirmed & Cleared Payable ${existing.requisition_no} for Cheque Release`);

    // Notify Treasury / Accounting to issue cheque
    const acctUsers = await db('users').whereIn('role', ['Super Admin', 'Accounting']);
    for (const u of acctUsers) {
      await db('notifications').insert({
        user_id: u.id,
        title: 'Cheque Ready for Issuance',
        message: `${existing.requisition_no} confirmed by COO. Cheque can now be prepared for ${existing.supplier_name}.`,
        type: 'payable',
        priority: 'normal'
      });
    }

    res.json({ success: true, message: `Payable ${existing.requisition_no} confirmed by COO for cheque issuance` });
  } catch (err) {
    console.error('cooConfirmPayable error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 8. Issue Cheque
exports.issueCheque = async (req, res) => {
  try {
    const { id } = req.params;
    const { bank_name, cheque_number, cheque_date, released_to, remarks } = req.body;

    if (!bank_name || !cheque_number || !cheque_date) {
      return res.status(400).json({ success: false, message: 'Bank name, Cheque number, and Cheque date are required' });
    }

    const existing = await db('payables').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Payable not found' });
    }

    await db('cheque_issuances').insert({
      payable_id: id,
      bank_name: bank_name.trim(),
      cheque_number: cheque_number.trim(),
      cheque_date,
      released_to: released_to ? released_to.trim() : null,
      released_at: db.fn.now(),
      issued_by: req.user.id,
      remarks: remarks ? remarks.trim() : null
    });

    await db('payables').where({ id }).update({
      status: 'Cheque Issued',
      updated_at: db.fn.now()
    });

    await logActivity(req.user.id, 'ISSUE_CHEQUE', `Issued Cheque #${cheque_number} (${bank_name}) for ${existing.requisition_no}`);

    res.json({ success: true, message: `Cheque #${cheque_number} recorded for ${existing.requisition_no}` });
  } catch (err) {
    console.error('issueCheque error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 9. Mark Cheque Cleared (Bank Reconciliation)
exports.markCleared = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db('payables').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Payable not found' });
    }

    await db('cheque_issuances').where({ payable_id: id }).update({
      cleared_at: db.fn.now()
    });

    await db('payables').where({ id }).update({
      status: 'Cleared',
      updated_at: db.fn.now()
    });

    await logActivity(req.user.id, 'CLEAR_PAYABLE_CHEQUE', `Marked Cheque for ${existing.requisition_no} as Cleared in Bank`);

    res.json({ success: true, message: `Payable ${existing.requisition_no} marked as Cleared` });
  } catch (err) {
    console.error('markCleared error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 10. Approval Relay Dispatch (Generates secure one-click approval token for webhooks or email dispatch)
exports.relayApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approver_email, action = 'APPROVE' } = req.body;

    const payable = await db('payables').where({ id }).first();
    if (!payable) {
      return res.status(404).json({ success: false, message: 'Payable not found' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours validity

    await db('payable_approval_tokens').insert({
      payable_id: id,
      token,
      action: action.toUpperCase(),
      approver_email: approver_email ? approver_email.trim() : null,
      expires_at
    });

    const approvalUrl = `${req.protocol}://${req.get('host')}/api/payables/approval/action?token=${token}`;

    await logActivity(req.user?.id, 'RELAY_APPROVAL', `Generated Approval Relay Token for ${payable.requisition_no} (${action})`);

    res.json({
      success: true,
      message: 'Approval relay link generated successfully',
      data: {
        payable_id: id,
        requisition_no: payable.requisition_no,
        action,
        token,
        approval_url: approvalUrl,
        expires_at
      }
    });
  } catch (err) {
    console.error('relayApproval error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 11. Public / Tokenized Action Endpoint (Processed via Token from Email or Relay Webhook)
exports.processApprovalAction = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).send('<h3>Invalid Request: Token is missing.</h3>');
    }

    const record = await db('payable_approval_tokens')
      .where({ token })
      .andWhere('expires_at', '>', new Date())
      .andWhere({ used: false })
      .first();

    if (!record) {
      return res.status(400).send('<h3>Error: Approval link is invalid, already used, or expired.</h3>');
    }

    const payable = await db('payables').where({ id: record.payable_id }).first();
    if (!payable) {
      return res.status(404).send('<h3>Payable requisition no longer exists.</h3>');
    }

    if (record.action === 'APPROVE') {
      await db('payables').where({ id: payable.id }).update({
        status: 'Approved',
        approved_at: db.fn.now(),
        updated_at: db.fn.now()
      });
    } else if (record.action === 'COO_CONFIRM') {
      await db('payables').where({ id: payable.id }).update({
        status: 'Confirmed',
        coo_confirmed_at: db.fn.now(),
        updated_at: db.fn.now()
      });
    } else if (record.action === 'REJECT') {
      await db('payables').where({ id: payable.id }).update({
        status: 'Rejected',
        rejection_reason: 'Rejected via Email Relay Link',
        updated_at: db.fn.now()
      });
    }

    // Mark token as used
    await db('payable_approval_tokens').where({ id: record.id }).update({ used: true });

    // Return clean HTML response
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payable Approval Confirmation</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 40px; text-align: center; }
          .card { background: white; max-width: 500px; margin: 40px auto; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .badge { display: inline-block; padding: 6px 16px; background: #ecfdf5; color: #059669; font-weight: 700; border-radius: 9999px; font-size: 14px; margin-bottom: 16px; }
          h2 { color: #0f172a; margin-bottom: 8px; }
          p { color: #64748b; font-size: 14px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">Action Completed</div>
          <h2>Payable ${record.action} Successful</h2>
          <p>Requisition <strong>${payable.requisition_no}</strong> for <strong>${payable.supplier_name}</strong> (PHP ${parseFloat(payable.gross_amount).toLocaleString()}) has been processed successfully.</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('processApprovalAction error:', err);
    res.status(500).send('<h3>Internal Server Error while processing approval action.</h3>');
  }
};
