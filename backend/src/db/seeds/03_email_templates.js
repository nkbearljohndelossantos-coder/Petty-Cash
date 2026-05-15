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
