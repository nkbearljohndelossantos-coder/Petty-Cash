const crypto = require('crypto');
const db = require('../config/db');
const { sendEmail } = require('./emailService');
const { dispatchNotification } = require('./notificationDispatcher');
const { broadcast } = require('./socketService');

const TOKEN_EXPIRY_DAYS = 7;

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const generateToken = () => crypto.randomBytes(32).toString('hex');

const formatReference = (expenseId) =>
  `PCV-${String(expenseId).padStart(4, '0')}`;

const getClientIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';

const getFrontendUrl = () =>
  process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173';

exports.getApprovalSettings = async () => {
  const rows = await db('settings')
    .whereIn('key', [
      'liquidation_approval_threshold',
      'liquidation_approval_email_enabled',
      'liquidation_approval_recipient_email'
    ]);

  const settings = {
    liquidation_approval_threshold: 10000,
    liquidation_approval_email_enabled: true,
    liquidation_approval_recipient_email: ''
  };

  rows.forEach((row) => {
    if (row.key === 'liquidation_approval_threshold') {
      settings.liquidation_approval_threshold = parseFloat(row.value) || 0;
    } else if (row.key === 'liquidation_approval_email_enabled') {
      settings.liquidation_approval_email_enabled = row.value === 'true';
    } else if (row.key === 'liquidation_approval_recipient_email') {
      settings.liquidation_approval_recipient_email = row.value || '';
    }
  });

  let approvers = [];
  if (await db.schema.hasTable('liquidation_approvers')) {
    approvers = await db('liquidation_approvers')
      .where({ is_active: true })
      .orderBy('approval_level', 'asc');
  }

  settings.approvers = approvers;

  return settings;
};

exports.updateApprovalSettings = async (data) => {
  const updates = {};

  if (data.liquidation_approval_threshold !== undefined) {
    updates.liquidation_approval_threshold = String(data.liquidation_approval_threshold);
  }
  if (data.liquidation_approval_email_enabled !== undefined) {
    updates.liquidation_approval_email_enabled = data.liquidation_approval_email_enabled ? 'true' : 'false';
  }
  if (data.liquidation_approval_recipient_email !== undefined) {
    updates.liquidation_approval_recipient_email = data.liquidation_approval_recipient_email;
  }

  for (const [key, value] of Object.entries(updates)) {
    const existing = await db('settings').where({ key }).first();
    if (existing) {
      await db('settings').where({ key }).update({ value, updated_at: db.fn.now() });
    } else {
      await db('settings').insert({ key, value });
    }
  }

  return exports.getApprovalSettings();
};

exports.getActiveApprovers = async () => {
  const settings = await exports.getApprovalSettings();
  const approvers = [...(settings.approvers || [])];

  if (settings.liquidation_approval_recipient_email) {
    const primaryExists = approvers.some(
      (a) => a.email.toLowerCase() === settings.liquidation_approval_recipient_email.toLowerCase()
    );
    if (!primaryExists) {
      approvers.unshift({
        id: 0,
        email: settings.liquidation_approval_recipient_email,
        name: 'Primary Approver',
        approval_level: 1,
        is_active: true
      });
    }
  }

  const byLevel = {};
  approvers.forEach((a) => {
    if (!byLevel[a.approval_level]) byLevel[a.approval_level] = a;
  });

  return Object.keys(byLevel)
    .map(Number)
    .sort((a, b) => a - b)
    .map((level) => byLevel[level]);
};

exports.shouldRequireApproval = async (amount) => {
  const settings = await exports.getApprovalSettings();
  return parseFloat(amount) >= settings.liquidation_approval_threshold;
};

exports.recordAudit = async ({
  expenseId,
  action,
  actorType = 'user',
  actorUserId = null,
  actorEmail = null,
  actorName = null,
  ipAddress = null,
  declineReason = null,
  approvalLevel = 1
}) => {
  if (!(await db.schema.hasTable('liquidation_approval_audit'))) return;

  await db('liquidation_approval_audit').insert({
    expense_id: expenseId,
    action,
    actor_type: actorType,
    actor_user_id: actorUserId,
    actor_email: actorEmail,
    actor_name: actorName,
    ip_address: ipAddress,
    decline_reason: declineReason,
    approval_level: approvalLevel
  });
};

const getExpenseDetails = async (expenseId) => {
  return db('expenses')
    .leftJoin('categories', 'expenses.category_id', 'categories.id')
    .leftJoin('departments', 'expenses.department_id', 'departments.id')
    .leftJoin('users as creator', 'expenses.created_by', 'creator.id')
    .select(
      'expenses.*',
      'categories.name as category_name',
      'departments.name as department_name',
      'creator.full_name as creator_name',
      'creator.email as creator_email'
    )
    .where('expenses.id', expenseId)
    .first();
};

exports.getExpenseAuditTrail = async (expenseId) => {
  if (!(await db.schema.hasTable('liquidation_approval_audit'))) {
    return [];
  }

  const audits = await db('liquidation_approval_audit')
    .leftJoin('users', 'liquidation_approval_audit.actor_user_id', 'users.id')
    .select(
      'liquidation_approval_audit.*',
      'users.full_name as user_full_name'
    )
    .where('liquidation_approval_audit.expense_id', expenseId)
    .orderBy('liquidation_approval_audit.created_at', 'asc');

  const createdLog = await db('activity_logs')
    .leftJoin('users', 'activity_logs.user_id', 'users.id')
    .select('activity_logs.*', 'users.full_name')
    .where('activity_logs.action', 'CREATE_EXPENSE')
    .where('activity_logs.details', 'like', `%ID ${expenseId}%`)
    .first();

  const trail = [];

  if (createdLog) {
    trail.push({
      action: 'created',
      label: 'Created By',
      actor_name: createdLog.full_name,
      ip_address: createdLog.ip_address,
      created_at: createdLog.created_at
    });
  }

  audits.forEach((a) => {
    const labels = {
      created: 'Created By',
      submitted: 'Submitted By',
      approved: 'Approved By',
      declined: 'Declined By'
    };
    trail.push({
      action: a.action,
      label: labels[a.action] || a.action,
      actor_name: a.actor_name || a.user_full_name || a.actor_email || 'System',
      actor_email: a.actor_email,
      ip_address: a.ip_address,
      decline_reason: a.decline_reason,
      approval_level: a.approval_level,
      created_at: a.created_at
    });
  });

  return trail;
};

const invalidateTokensForExpense = async (expenseId) => {
  await db('liquidation_approval_tokens')
    .where({ expense_id: expenseId })
    .whereNull('used_at')
    .update({ used_at: db.fn.now() });
};

const createApprovalTokens = async (expenseId, approvalLevel = 1) => {
  await invalidateTokensForExpense(expenseId);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  const approveToken = generateToken();
  const declineToken = generateToken();

  await db('liquidation_approval_tokens').insert([
    {
      expense_id: expenseId,
      token_hash: hashToken(approveToken),
      action_type: 'approve',
      approval_level: approvalLevel,
      expires_at: expiresAt
    },
    {
      expense_id: expenseId,
      token_hash: hashToken(declineToken),
      action_type: 'decline',
      approval_level: approvalLevel,
      expires_at: expiresAt
    }
  ]);

  return { approveToken, declineToken };
};

exports.sendApprovalEmail = async (expense, approvalLevel = 1) => {
  const settings = await exports.getApprovalSettings();
  if (!settings.liquidation_approval_email_enabled) return false;

  const approvers = await exports.getActiveApprovers();
  const approver = approvers.find((a) => a.approval_level === approvalLevel) || approvers[0];

  if (!approver?.email) {
    console.warn('No approver email configured for liquidation approval');
    return false;
  }

  const { approveToken, declineToken } = await createApprovalTokens(expense.id, approvalLevel);
  const baseUrl = getFrontendUrl();

  await sendEmail({
    templateName: 'liquidation_approval_request',
    recipient: approver.email,
    data: {
      reference_number: formatReference(expense.id),
      requested_by: expense.requested_by,
      department: expense.department_name || 'N/A',
      category: expense.category_name || 'N/A',
      amount: parseFloat(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      remarks: expense.remarks || 'No remarks provided',
      approve_link: `${baseUrl}/approval/approve/${approveToken}`,
      decline_link: `${baseUrl}/approval/decline/${declineToken}`
    }
  });

  return true;
};

exports.initiateApprovalWorkflow = async (expenseId, submittedByUserId, ipAddress, context = 'liquidation') => {
  const expense = await getExpenseDetails(expenseId);
  if (!expense) throw new Error('Expense not found');

  const approvers = await exports.getActiveApprovers();
  const totalLevels = approvers.length || 1;

  await db('expenses').where({ id: expenseId }).update({
    status: 'For Approval',
    current_approval_level: 1,
    submitted_by: submittedByUserId,
    submitted_at: db.fn.now(),
    approval_context: context,
    updated_at: db.fn.now()
  });

  await exports.recordAudit({
    expenseId,
    action: 'submitted',
    actorType: 'user',
    actorUserId: submittedByUserId,
    ipAddress,
    approvalLevel: 1
  });

  const updatedExpense = await getExpenseDetails(expenseId);
  await exports.sendApprovalEmail(updatedExpense, 1);

  broadcast('expense_updated', {
    expenseId,
    status: 'For Approval',
    context
  });

  return updatedExpense;
};

exports.createExpenseWithApprovalCheck = async (expenseId, userId, amount, ipAddress) => {
  const requiresApproval = await exports.shouldRequireApproval(amount);

  if (requiresApproval) {
    await exports.recordAudit({
      expenseId,
      action: 'created',
      actorType: 'user',
      actorUserId: userId,
      ipAddress,
      approvalLevel: 0
    });

    return exports.initiateApprovalWorkflow(expenseId, userId, ipAddress, 'create');
  }

  await exports.recordAudit({
    expenseId,
    action: 'created',
    actorType: 'user',
    actorUserId: userId,
    ipAddress,
    approvalLevel: 0
  });

  return null;
};

const notifyRequester = async (expense, status, extra = {}) => {
  if (!expense.created_by) return;

  const templateName = status === 'Liquidated'
    ? 'liquidation_approved_requester'
    : 'liquidation_declined_requester';

  const link = `${getFrontendUrl()}/expenses?id=${expense.id}`;

  await dispatchNotification(expense.created_by, {
    title: status === 'Liquidated' ? 'Liquidation Approved' : 'Liquidation Declined',
    message: `Your liquidation ${formatReference(expense.id)} for ₱${expense.amount} has been ${status === 'Liquidated' ? 'approved and liquidated' : 'declined'}.`,
    type: status === 'Liquidated' ? 'success' : 'error',
    link: `/expenses?id=${expense.id}`,
    templateName,
    data: {
      reference_number: formatReference(expense.id),
      amount: parseFloat(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      fullName: expense.creator_name || expense.requested_by,
      approver_name: extra.approverName || 'Approver',
      decline_reason: extra.declineReason || '',
      action_datetime: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
      link,
      status: status === 'Liquidated' ? 'Approved' : 'Declined',
      color: status === 'Liquidated' ? '#059669' : '#dc2626',
      remarks: expense.remarks || ''
    }
  });
};

const findValidToken = async (token, actionType) => {
  const tokenHash = hashToken(token);
  const record = await db('liquidation_approval_tokens')
    .where({ token_hash: tokenHash, action_type: actionType })
    .whereNull('used_at')
    .where('expires_at', '>', new Date())
    .first();

  return record;
};

exports.verifyToken = async (token) => {
  const tokenHash = hashToken(token);
  const record = await db('liquidation_approval_tokens')
    .where({ token_hash: tokenHash })
    .whereNull('used_at')
    .where('expires_at', '>', new Date())
    .first();

  if (!record) return null;

  const expense = await getExpenseDetails(record.expense_id);
  if (!expense || expense.status !== 'For Approval') return null;

  return {
    action_type: record.action_type,
    approval_level: record.approval_level,
    expense: {
      id: expense.id,
      reference_number: formatReference(expense.id),
      requested_by: expense.requested_by,
      department_name: expense.department_name,
      category_name: expense.category_name,
      amount: expense.amount,
      remarks: expense.remarks,
      status: expense.status
    }
  };
};

exports.processApproval = async (token, ipAddress, approverEmail = null) => {
  const record = await findValidToken(token, 'approve');
  if (!record) throw new Error('Invalid or expired approval link');

  const expense = await getExpenseDetails(record.expense_id);
  if (!expense || expense.status !== 'For Approval') {
    throw new Error('This expense is no longer pending approval');
  }

  const approvers = await exports.getActiveApprovers();
  const totalLevels = approvers.length || 1;
  const currentLevel = record.approval_level;

  await db('liquidation_approval_tokens')
    .where({ expense_id: record.expense_id })
    .whereNull('used_at')
    .update({ used_at: db.fn.now() });

  const approver = approvers.find((a) => a.approval_level === currentLevel) || approvers[0];
  const approverName = approver?.name || approver?.email || approverEmail || 'Email Approver';

  await exports.recordAudit({
    expenseId: record.expense_id,
    action: 'approved',
    actorType: 'email',
    actorEmail: approver?.email || approverEmail,
    actorName: approverName,
    ipAddress,
    approvalLevel: currentLevel
  });

  if (currentLevel < totalLevels) {
    const nextLevel = currentLevel + 1;
    await db('expenses').where({ id: record.expense_id }).update({
      current_approval_level: nextLevel,
      updated_at: db.fn.now()
    });

    const updatedExpense = await getExpenseDetails(record.expense_id);
    await exports.sendApprovalEmail(updatedExpense, nextLevel);

    broadcast('expense_updated', {
      expenseId: record.expense_id,
      status: 'For Approval',
      approvalLevel: nextLevel
    });

    return { status: 'For Approval', expense: updatedExpense, multiLevel: true, level: nextLevel };
  }

  const finalStatus = expense.approval_context === 'liquidation' ? 'Liquidated' : 'Approved';

  await db('expenses').where({ id: record.expense_id }).update({
    status: finalStatus,
    updated_at: db.fn.now()
  });

  const finalExpense = await getExpenseDetails(record.expense_id);

  if (finalStatus === 'Liquidated') {
    await notifyRequester(finalExpense, 'Liquidated', { approverName });
    broadcast('balance_updated', { type: 'LIQUIDATION_APPROVED', expenseId: record.expense_id });
  } else {
    await dispatchNotification(finalExpense.created_by, {
      title: 'Expense Approved',
      message: `Your expense ${formatReference(finalExpense.id)} for ₱${finalExpense.amount} has been approved.`,
      type: 'success',
      link: `/expenses?id=${finalExpense.id}`,
      templateName: 'expense_status_update',
      data: {
        status: 'Approved',
        amount: parseFloat(finalExpense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        color: '#059669',
        remarks: finalExpense.remarks || ''
      }
    });
    broadcast('balance_updated', { type: 'APPROVAL_APPROVED', expenseId: record.expense_id });
  }

  broadcast('expense_updated', { expenseId: record.expense_id, status: finalStatus });

  return { status: finalStatus, expense: finalExpense };
};

exports.processDecline = async (token, declineReason, ipAddress, approverEmail = null) => {
  if (!declineReason || !declineReason.trim()) {
    throw new Error('A decline reason is required');
  }

  const record = await findValidToken(token, 'decline');
  if (!record) throw new Error('Invalid or expired decline link');

  const expense = await getExpenseDetails(record.expense_id);
  if (!expense || expense.status !== 'For Approval') {
    throw new Error('This expense is no longer pending approval');
  }

  const approvers = await exports.getActiveApprovers();
  const approver = approvers.find((a) => a.approval_level === record.approval_level) || approvers[0];
  const approverName = approver?.name || approver?.email || approverEmail || 'Email Approver';

  await db('liquidation_approval_tokens')
    .where({ expense_id: record.expense_id })
    .whereNull('used_at')
    .update({ used_at: db.fn.now() });

  await db('expenses').where({ id: record.expense_id }).update({
    status: 'Declined',
    updated_at: db.fn.now()
  });

  await exports.recordAudit({
    expenseId: record.expense_id,
    action: 'declined',
    actorType: 'email',
    actorEmail: approver?.email || approverEmail,
    actorName: approverName,
    ipAddress,
    declineReason: declineReason.trim(),
    approvalLevel: record.approval_level
  });

  const finalExpense = await getExpenseDetails(record.expense_id);
  await notifyRequester(finalExpense, 'Declined', { approverName, declineReason: declineReason.trim() });

  broadcast('expense_updated', { expenseId: record.expense_id, status: 'Declined' });

  return { status: 'Declined', expense: finalExpense };
};

// CRUD for approvers (future multi-level)
exports.listApprovers = async () => {
  if (!(await db.schema.hasTable('liquidation_approvers'))) return [];
  return db('liquidation_approvers').orderBy('approval_level', 'asc');
};

exports.addApprover = async (data) => {
  const [id] = await db('liquidation_approvers').insert({
    email: data.email,
    name: data.name || null,
    approval_level: data.approval_level || 1,
    is_active: data.is_active !== false
  });
  return db('liquidation_approvers').where({ id }).first();
};

exports.updateApprover = async (id, data) => {
  await db('liquidation_approvers').where({ id }).update({
    email: data.email,
    name: data.name,
    approval_level: data.approval_level,
    is_active: data.is_active,
    updated_at: db.fn.now()
  });
  return db('liquidation_approvers').where({ id }).first();
};

exports.deleteApprover = async (id) => {
  await db('liquidation_approvers').where({ id }).del();
};

exports.getClientIp = getClientIp;
exports.formatReference = formatReference;
