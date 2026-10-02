const db = require('../config/db');
const crypto = require('crypto');
const { logActivity } = require('../utils/logService');
const { sendPayableToFms, getFmsConfig } = require('../services/fmsService');

// Helper to generate sequential requisition number PB-YYYYMM-XXXX
async function generateRequisitionNo() {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const latest = await db('payables')
    .whereRaw('requisition_no LIKE ?', [`PB-${yearMonth}-%`])
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
  return `PB-${yearMonth}-${String(nextSeq).padStart(4, '0')}`;
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

    // Apply role scoping
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
          .orWhereRaw('LOWER(COALESCE(payables.invoice_no, "")) LIKE ?', [term])
          .orWhereRaw('LOWER(COALESCE(payables.company, "")) LIKE ?', [term])
          .orWhereRaw('LOWER(COALESCE(payables.control_number, "")) LIKE ?', [term])
          .orWhereRaw('LOWER(COALESCE(payables.description, "")) LIKE ?', [term])
          .orWhereRaw('LOWER(COALESCE(payables.remarks, "")) LIKE ?', [term]);
      });
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const payables = await query.orderBy('payables.id', 'desc').limit(parseInt(limit, 10)).offset(offset);

    const payableIds = payables.map(p => p.id);
    const attachments = payableIds.length > 0 
      ? await db('payable_attachments').whereIn('payable_id', payableIds)
      : [];
    const cheques = payableIds.length > 0
      ? await db('cheque_issuances').whereIn('payable_id', payableIds)
      : [];
    const items = payableIds.length > 0 && await db.schema.hasTable('payable_items')
      ? await db('payable_items').whereIn('payable_id', payableIds)
      : [];

    const enriched = payables.map(p => ({
      ...p,
      attachments: attachments.filter(a => a.payable_id === p.id),
      cheques: cheques.filter(c => c.payable_id === p.id),
      items: items.filter(i => i.payable_id === p.id)
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
    const items = await db.schema.hasTable('payable_items')
      ? await db('payable_items').where({ payable_id: id })
      : [];

    res.json({
      success: true,
      data: {
        ...payable,
        attachments,
        cheques,
        items
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
      company = 'NKB Manufacturing Corporation',
      supplier_name,
      vendor,
      invoice_no,
      invoice_number,
      invoice_date,
      payable_category = 'Trade payable',
      control_number,
      term = 'Net 30',
      description,
      bank_account,
      bank_to_use,
      department_id,
      gross_amount,
      ewt_rate = 0,
      due_date,
      remarks,
      comments,
      items
    } = req.body;

    const finalSupplier = (vendor || supplier_name || '').trim();
    const finalInvoiceNo = (invoice_number || invoice_no || '').trim();
    const finalBankAccount = (bank_to_use || bank_account || '').trim();
    const finalComments = (comments || remarks || '').trim();

    // Parse items if supplied
    let parsedItems = [];
    if (typeof items === 'string') {
      try {
        parsedItems = JSON.parse(items);
      } catch (e) {
        parsedItems = [];
      }
    } else if (Array.isArray(items)) {
      parsedItems = items;
    }

    let calculatedGross = 0;
    if (parsedItems.length > 0) {
      calculatedGross = parsedItems.reduce((sum, item) => {
        const qty = parseFloat(item.quantity) || 1;
        const cost = parseFloat(item.cost) || 0;
        const sub = parseFloat(item.subtotal) || (qty * cost);
        return sum + sub;
      }, 0);
    } else {
      calculatedGross = parseFloat(gross_amount) || 0;
    }

    if (!finalSupplier) {
      return res.status(400).json({ success: false, message: 'Vendor / Supplier name is required' });
    }

    if (calculatedGross <= 0 && (!gross_amount || parseFloat(gross_amount) <= 0)) {
      return res.status(400).json({ success: false, message: 'Total amount due must be greater than 0' });
    }

    const gross = calculatedGross;
    const rate = parseFloat(ewt_rate) || 0;
    const ewt = parseFloat(((gross * rate) / 100).toFixed(2));
    const net = parseFloat((gross - ewt).toFixed(2));

    const requisition_no = await generateRequisitionNo();

    const [id] = await db('payables').insert({
      requisition_no,
      company: company ? company.trim() : 'NKB Manufacturing Corporation',
      payable_category: payable_category ? payable_category.trim() : 'Trade payable',
      invoice_date: invoice_date || null,
      control_number: control_number ? control_number.trim() : null,
      supplier_name: finalSupplier,
      invoice_no: finalInvoiceNo || null,
      term: term ? term.trim() : 'Net 30',
      description: description ? description.trim() : null,
      bank_account: finalBankAccount || null,
      department_id: department_id ? parseInt(department_id, 10) : (req.user?.department_id || null),
      user_id: req.user?.id || null,
      gross_amount: gross,
      ewt_rate: rate,
      ewt_amount: ewt,
      net_amount: net,
      due_date: due_date || null,
      status: 'Submitted For Approval',
      remarks: finalComments || null,
      comments: finalComments || null
    });

    // Save line items
    if (parsedItems.length > 0 && await db.schema.hasTable('payable_items')) {
      const itemRows = parsedItems.map(item => {
        const q = parseFloat(item.quantity) || 1;
        const c = parseFloat(item.cost) || 0;
        return {
          payable_id: id,
          description: (item.description || '').trim() || 'Item',
          expense_category: item.expense_category || 'Raw Materials',
          quantity: q,
          cost: c,
          subtotal: parseFloat((q * c).toFixed(2))
        };
      });
      await db('payable_items').insert(itemRows);
    }

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

    await logActivity(req.user?.id, 'CREATE_PAYABLE', `Created Payable Requisition ${requisition_no} for ${finalSupplier} - Amount: PHP ${gross}`);

    // Create a notification for COO & Accounting
    const cooUsers = await db('users').whereIn('role', ['Super Admin', 'COO', 'Accounting']);
    for (const u of cooUsers) {
      await db('notifications').insert({
        user_id: u.id,
        title: 'New Payable Request',
        message: `${requisition_no} submitted for ${finalSupplier} (₱${gross.toLocaleString(undefined, { minimumFractionDigits: 2 })})`,
        type: 'payable',
        priority: 'important'
      });
    }

    const created = await db('payables').where({ id }).first();

    // Outbound synchronization to FMS (fms.nkbmanufacturing.com) for COO Approval
    (async () => {
      try {
        const config = await getFmsConfig();
        if (config.isAutoSync) {
          const syncItems = parsedItems.length > 0 ? parsedItems : [];
          await sendPayableToFms({
            ...created,
            requestor_name: req.user?.full_name || req.user?.username || 'Petty Cash User',
            items: syncItems
          }, config);
        }
      } catch (fmsErr) {
        console.error('Async FMS auto-sync error:', fmsErr.message);
      }
    })();

    res.status(201).json({ success: true, message: 'Payable request created successfully', data: created });
  } catch (err) {
    console.error('createPayable error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create payable request' });
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

// 12. Manual / On-Demand Sync to FMS (fms.nkbmanufacturing.com)
exports.syncPayableToFms = async (req, res) => {
  try {
    const { id } = req.params;
    const payable = await db('payables')
      .leftJoin('users as requestor', 'payables.user_id', 'requestor.id')
      .select('payables.*', 'requestor.full_name as requestor_name', 'requestor.username as requestor_username')
      .where('payables.id', id)
      .first();

    if (!payable) {
      return res.status(404).json({ success: false, message: 'Payable not found' });
    }

    const items = await db.schema.hasTable('payable_items')
      ? await db('payable_items').where({ payable_id: id })
      : [];

    const syncResult = await sendPayableToFms({
      ...payable,
      items
    });

    if (syncResult.success) {
      await logActivity(req.user?.id, 'SYNC_FMS', `Synced Payable ${payable.requisition_no} to FMS for COO Approval`);
      return res.json({
        success: true,
        message: `Payable ${payable.requisition_no} successfully transmitted to FMS (fms.nkbmanufacturing.com)!`,
        data: syncResult.data
      });
    } else {
      return res.status(502).json({
        success: false,
        message: `FMS Sync Error: ${syncResult.message || 'Failed to transmit to FMS'}`
      });
    }
  } catch (err) {
    console.error('syncPayableToFms error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
