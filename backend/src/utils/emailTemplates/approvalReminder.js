const APPROVAL_REMINDER_SUBJECT =
  '[REMINDER] Approval Required — {{reference_number}} | ₱{{amount}}';

const APPROVAL_REMINDER_BODY = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 620px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1px solid #fcd34d; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
    <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #b45309;">NKB Petty Cash — Approval Reminder</p>
    <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #92400e;">Action Still Required</h2>
    <p style="margin: 10px 0 0; font-size: 14px; color: #78350f; line-height: 1.6;">
      This is a follow-up reminder. The request below is still pending your approval.
      Please review the details and respond using the secure buttons below.
    </p>
  </div>

  <div style="background: #f8fafc; padding: 20px 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr><td style="padding: 8px 0; color: #64748b; width: 38%;">Reference No.</td><td style="padding: 8px 0; font-weight: 700;">{{reference_number}}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Requester</td><td style="padding: 8px 0; font-weight: 600;">{{requested_by}}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Department</td><td style="padding: 8px 0;">{{department}}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Category</td><td style="padding: 8px 0;">{{category}}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Amount</td><td style="padding: 8px 0; font-weight: 800; color: #0f172a; font-size: 16px;">₱{{amount}}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b; vertical-align: top;">Remarks</td><td style="padding: 8px 0;">{{remarks}}</td></tr>
    </table>
  </div>

  <div style="background: #fff7ed; border: 1px dashed #fdba74; border-radius: 10px; padding: 14px 18px; margin-bottom: 28px; font-size: 13px; color: #9a3412;">
    <strong>Reminder #{{reminder_count}}</strong> sent by <strong>{{reminded_by}}</strong>.
    Your timely response helps keep petty cash processing on schedule.
  </div>

  <div style="text-align: center; margin: 32px 0 24px;">
    <a href="{{approve_link}}" style="display: inline-block; padding: 15px 36px; background: #059669; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 14px; letter-spacing: 0.04em; margin: 0 8px 12px;">✓ APPROVE</a>
    <a href="{{decline_link}}" style="display: inline-block; padding: 15px 36px; background: #dc2626; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 14px; letter-spacing: 0.04em; margin: 0 8px 12px;">✕ DECLINE</a>
  </div>

  <p style="font-size: 12px; color: #64748b; text-align: center; line-height: 1.6; margin: 0;">
    These secure one-click links expire in 7 days. No login is required to respond.<br/>
    If you already acted on this request, you may disregard this reminder.
  </p>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 16px;" />
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
    NKB Manufacturing — Petty Cash Management System<br/>
    This is an automated reminder. Please do not reply to this email.
  </p>
</div>
`;

module.exports = {
  APPROVAL_REMINDER_SUBJECT,
  APPROVAL_REMINDER_BODY,
  APPROVAL_REMINDER_TEMPLATE: {
    name: 'approval_reminder',
    subject: APPROVAL_REMINDER_SUBJECT,
    body: APPROVAL_REMINDER_BODY,
    type: 'approval'
  }
};
