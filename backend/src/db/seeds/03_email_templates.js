exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('email_templates').del();
  await knex('email_templates').insert([
    {
      name: 'expense_request_admin',
      subject: 'New Petty Cash Request: {{amount}} by {{requested_by}}',
      body: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">New Petty Cash Request</h2>
          <p>Hi Admin,</p>
          <p>A new expense request has been submitted for approval:</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <p><strong>Requested By:</strong> {{requested_by}}</p>
            <p><strong>Amount:</strong> ₱{{amount}}</p>
            <p><strong>Remarks:</strong> {{remarks}}</p>
          </div>
          <p>Please log in to the NKB Petty Cash System to review and approve this request.</p>
          <a href="{{link}}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Review Request</a>
          <p style="margin-top: 20px; font-size: 12px; color: #64748b;">This is an automated notification from NKB Manufacturing System.</p>
        </div>
      `,
      type: 'approval'
    },
    {
      name: 'expense_status_update',
      subject: 'Update: Your Petty Cash Request is {{status}}',
      body: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: {{color}};">Expense Request {{status}}</h2>
          <p>Hi {{fullName}},</p>
          <p>Your petty cash request for <strong>₱{{amount}}</strong> has been <strong>{{status}}</strong>.</p>
          <p><strong>Remarks:</strong> {{remarks}}</p>
          <a href="{{link}}" style="display: inline-block; padding: 12px 24px; background: {{color}}; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">View Details</a>
          <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Thank you for your cooperation.</p>
        </div>
      `,
      type: 'expense_status'
    },
    {
      name: 'liquidation_approval_request',
      subject: 'Liquidation Approval Required: {{reference_number}} — ₱{{amount}}',
      body: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px;">
          <h2 style="color: #2563eb;">Liquidation Approval Request</h2>
          <p>A petty cash liquidation requires your approval because the amount exceeds the configured threshold.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <p><strong>Reference Number:</strong> {{reference_number}}</p>
            <p><strong>Requester Name:</strong> {{requested_by}}</p>
            <p><strong>Department:</strong> {{department}}</p>
            <p><strong>Category:</strong> {{category}}</p>
            <p><strong>Amount:</strong> ₱{{amount}}</p>
            <p><strong>Remarks:</strong> {{remarks}}</p>
          </div>
          <div style="margin: 30px 0; text-align: center;">
            <a href="{{approve_link}}" style="display: inline-block; padding: 14px 32px; background: #059669; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">Approve</a>
            <a href="{{decline_link}}" style="display: inline-block; padding: 14px 32px; background: #dc2626; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Decline</a>
          </div>
          <p style="font-size: 12px; color: #64748b;">These secure links expire in 7 days. No login is required to respond.</p>
        </div>
      `,
      type: 'approval'
    },
    {
      name: 'liquidation_approved_requester',
      subject: 'Approved: Your liquidation {{reference_number}} has been liquidated',
      body: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #059669;">Liquidation Approved</h2>
          <p>Hi {{fullName}},</p>
          <p>Your petty cash liquidation request <strong>{{reference_number}}</strong> for <strong>₱{{amount}}</strong> has been approved and liquidated.</p>
          <p><strong>Approved By:</strong> {{approver_name}}</p>
          <p><strong>Date & Time:</strong> {{action_datetime}}</p>
          <a href="{{link}}" style="display: inline-block; padding: 12px 24px; background: #059669; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">View Details</a>
        </div>
      `,
      type: 'expense_status'
    },
    {
      name: 'liquidation_declined_requester',
      subject: 'Declined: Your liquidation {{reference_number}} was not approved',
      body: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #dc2626;">Liquidation Declined</h2>
          <p>Hi {{fullName}},</p>
          <p>Your petty cash liquidation request <strong>{{reference_number}}</strong> for <strong>₱{{amount}}</strong> has been declined.</p>
          <p><strong>Declined By:</strong> {{approver_name}}</p>
          <p><strong>Reason:</strong> {{decline_reason}}</p>
          <p><strong>Date & Time:</strong> {{action_datetime}}</p>
          <a href="{{link}}" style="display: inline-block; padding: 12px 24px; background: #dc2626; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">View Details</a>
        </div>
      `,
      type: 'expense_status'
    },
    {
      name: 'fund_replenished',
      subject: 'System Alert: Petty Cash Fund Replenished',
      body: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #059669;">Fund Replenished</h2>
          <p>Hi Admin,</p>
          <p>The petty cash fund has been topped up with <strong>₱{{amount}}</strong>.</p>
          <p>Current system balance has been updated accordingly.</p>
          <a href="{{link}}" style="display: inline-block; padding: 12px 24px; background: #059669; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">View Funds</a>
        </div>
      `,
      type: 'finance'
    }
  ]);
};
