const approvalService = require('../services/approvalService');
const { isEmailConfigured, verifyConnection, sendApprovalEmail, getSmtpConfig } = require('../services/emailService');

exports.getSettings = async (req, res) => {
  try {
    const settings = await approvalService.getApprovalSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await approvalService.updateApprovalSettings(req.body);
    res.json({ success: true, data: settings, message: 'Approval settings updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listApprovers = async (req, res) => {
  try {
    const approvers = await approvalService.listApprovers();
    res.json({ success: true, data: approvers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addApprover = async (req, res) => {
  try {
    const { email, name, approval_level, is_active } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const approver = await approvalService.addApprover({ email, name, approval_level, is_active });
    res.status(201).json({ success: true, data: approver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateApprover = async (req, res) => {
  try {
    const approver = await approvalService.updateApprover(req.params.id, req.body);
    res.json({ success: true, data: approver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteApprover = async (req, res) => {
  try {
    await approvalService.deleteApprover(req.params.id);
    res.json({ success: true, message: 'Approver removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    const result = await approvalService.verifyToken(req.params.token);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Invalid or expired link' });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approveByToken = async (req, res) => {
  try {
    const ip = approvalService.getClientIp(req);
    const result = await approvalService.processApproval(req.params.token, ip);
    res.json({
      success: true,
      data: result,
      message: result.status === 'Liquidated'
        ? 'Liquidation approved successfully'
        : `Approved at level ${result.level}. Sent to next approver.`
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.declineByToken = async (req, res) => {
  try {
    const { reason } = req.body;
    const ip = approvalService.getClientIp(req);
    const result = await approvalService.processDecline(req.params.token, reason, ip);
    res.json({ success: true, data: result, message: 'Liquidation declined' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getAuditTrail = async (req, res) => {
  try {
    const trail = await approvalService.getExpenseAuditTrail(req.params.expenseId);
    res.json({ success: true, data: trail });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEmailHealth = async (req, res) => {
  try {
    const configured = isEmailConfigured();
    let connected = false;
    let error = null;

    if (configured) {
      try {
        connected = await verifyConnection();
      } catch (err) {
        error = err.message;
      }
    }

    const settings = await approvalService.getApprovalSettings();

    res.json({
      success: true,
      data: {
        smtpConfigured: configured,
        smtpConnected: connected,
        smtpError: error,
        emailApprovalEnabled: settings.liquidation_approval_email_enabled,
        primaryApproverEmail: settings.liquidation_approval_recipient_email,
        approverCount: settings.approvers?.length || 0,
        threshold: settings.liquidation_approval_threshold
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/approval/send-approval ────────────────────────────────────────────
// Sends a custom approval request email via Hostinger SMTP.
//
// Sample Request Body (JSON):
// {
//   "to": "approver@company.com",
//   "subject": "Liquidation Approval Required – EXP-2026-0042",
//   "html": "<h1>Approval Request</h1><p>Please review the liquidation.</p>",
//   "cc": "finance@company.com",          // optional
//   "bcc": "audit@company.com",           // optional
//   "attachments": []                      // optional: [{ filename, path, contentType }]
// }
//
// Sample Success Response (200):
// {
//   "success": true,
//   "message": "Approval email sent successfully",
//   "data": { "messageId": "<abc123@smtp.hostinger.com>" }
// }
//
// Sample Error Response (400 / 500):
// {
//   "success": false,
//   "message": "SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env"
// }
exports.sendApprovalEmailHandler = async (req, res) => {
  try {
    const { to, subject, html, cc, bcc, attachments } = req.body;

    // ── Validation ─────────────────────────────────────────────────────────────
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: "to", "subject", and "html" are all required.'
      });
    }

    // ── Send via reusable mailer ────────────────────────────────────────────────
    const result = await sendApprovalEmail({ to, subject, html, cc, bcc, attachments });

    if (!result.success) {
      const status = result.skipped ? 503 : 500;
      return res.status(status).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Approval email sent successfully',
      data: { messageId: result.messageId }
    });
  } catch (err) {
    console.error('[sendApprovalEmailHandler] Unexpected error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};

// ─── POST /api/approval/remind/:expenseId ──────────────────────────────────────────
// Sends a reminder notification (email + in-app) to the current approver for
// an expense that is stuck in "For Approval" status.
// Accessible by Staff and Accounting roles (and above).
// 30-minute cooldown per expense to prevent spam.
exports.sendReminder = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const ipAddress = approvalService.getClientIp(req);

    const result = await approvalService.sendReminder(expenseId, req.user.id, ipAddress);

    const message = result.emailSent
      ? `Reminder sent to ${result.approver}. The approver has been notified via email and in-app.`
      : `Reminder sent to ${result.approver} via in-app notification. Email could not be sent: ${result.emailReason}`;

    res.json({ success: true, message, data: result });
  } catch (err) {
    const status = err.message.includes('wait') ? 429 : 400;
    res.status(status).json({ success: false, message: err.message });
  }
};
