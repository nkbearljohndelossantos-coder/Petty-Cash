exports.up = async function (knex) {
  // Use VARCHAR for status (ENUM alters often fail on shared hosting)
  const [statusCol] = await knex.raw("SHOW COLUMNS FROM expenses LIKE 'status'");
  const statusType = statusCol?.[0]?.Type || '';
  if (statusType.startsWith('enum')) {
    await knex.raw(`
      ALTER TABLE expenses
      MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Pending'
    `);
  }

  if (!(await knex.schema.hasColumn('expenses', 'current_approval_level'))) {
    await knex.schema.table('expenses', (table) => {
      table.integer('current_approval_level').unsigned().defaultTo(0);
      table.integer('submitted_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('submitted_at').nullable();
      table.string('approval_context', 20).nullable();
    });
  }

  if (!(await knex.schema.hasTable('liquidation_approvers'))) {
    await knex.schema.createTable('liquidation_approvers', (table) => {
      table.increments('id').primary();
      table.string('email').notNullable();
      table.string('name').nullable();
      table.integer('approval_level').unsigned().notNullable().defaultTo(1);
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('liquidation_approval_tokens'))) {
    await knex.schema.createTable('liquidation_approval_tokens', (table) => {
      table.increments('id').primary();
      table.integer('expense_id').unsigned().notNullable().references('id').inTable('expenses').onDelete('CASCADE');
      table.string('token_hash', 64).notNullable().unique();
      table.enum('action_type', ['approve', 'decline']).notNullable();
      table.integer('approval_level').unsigned().notNullable().defaultTo(1);
      table.timestamp('expires_at').notNullable();
      table.timestamp('used_at').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index(['expense_id', 'action_type']);
    });
  }

  if (!(await knex.schema.hasTable('liquidation_approval_audit'))) {
    await knex.schema.createTable('liquidation_approval_audit', (table) => {
      table.increments('id').primary();
      table.integer('expense_id').unsigned().notNullable().references('id').inTable('expenses').onDelete('CASCADE');
      table.enum('action', ['created', 'submitted', 'approved', 'declined']).notNullable();
      table.enum('actor_type', ['user', 'email']).notNullable().defaultTo('user');
      table.integer('actor_user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
      table.string('actor_email').nullable();
      table.string('actor_name').nullable();
      table.string('ip_address', 45).nullable();
      table.text('decline_reason').nullable();
      table.integer('approval_level').unsigned().defaultTo(1);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index(['expense_id', 'created_at']);
    });
  }

  // Default approval settings
  const defaultSettings = [
    { key: 'liquidation_approval_threshold', value: '10000' },
    { key: 'liquidation_approval_email_enabled', value: 'true' },
    { key: 'liquidation_approval_recipient_email', value: '' },
  ];

  for (const setting of defaultSettings) {
    const exists = await knex('settings').where({ key: setting.key }).first();
    if (!exists) {
      await knex('settings').insert(setting);
    }
  }

  // Email templates for liquidation approval workflow
  const templates = [
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
          <p style="margin-top: 20px; font-size: 12px; color: #64748b;">NKB Petty Cash System — Automated Liquidation Approval</p>
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
    }
  ];

  for (const tpl of templates) {
    const exists = await knex('email_templates').where({ name: tpl.name }).first();
    if (!exists) {
      await knex('email_templates').insert(tpl);
    }
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('liquidation_approval_audit');
  await knex.schema.dropTableIfExists('liquidation_approval_tokens');
  await knex.schema.dropTableIfExists('liquidation_approvers');

  if (await knex.schema.hasColumn('expenses', 'current_approval_level')) {
    await knex.schema.table('expenses', (table) => {
      table.dropColumn('current_approval_level');
      table.dropColumn('submitted_by');
      table.dropColumn('submitted_at');
      table.dropColumn('approval_context');
    });
  }

  await knex('settings').whereIn('key', [
    'liquidation_approval_threshold',
    'liquidation_approval_email_enabled',
    'liquidation_approval_recipient_email'
  ]).del();

  await knex('email_templates').whereIn('name', [
    'liquidation_approval_request',
    'liquidation_approved_requester',
    'liquidation_declined_requester'
  ]).del();

  await knex.raw(`
    ALTER TABLE expenses
    MODIFY COLUMN status ENUM(
      'Pending', 'Approved', 'Rejected', 'Liquidated'
    ) DEFAULT 'Pending'
  `);
};
