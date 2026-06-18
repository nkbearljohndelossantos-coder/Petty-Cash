exports.up = async function (knex) {
  if (await knex.schema.hasTable('liquidation_approval_audit')) {
    const [actionCol] = await knex.raw("SHOW COLUMNS FROM liquidation_approval_audit LIKE 'action'");
    const actionType = actionCol?.[0]?.Type || '';
    if (actionType.startsWith('enum')) {
      await knex.raw(`
        ALTER TABLE liquidation_approval_audit
        MODIFY COLUMN action VARCHAR(20) NOT NULL
      `);
    }

    const [actorTypeCol] = await knex.raw("SHOW COLUMNS FROM liquidation_approval_audit LIKE 'actor_type'");
    const actorType = actorTypeCol?.[0]?.Type || '';
    if (actorType.startsWith('enum')) {
      await knex.raw(`
        ALTER TABLE liquidation_approval_audit
        MODIFY COLUMN actor_type VARCHAR(10) NOT NULL DEFAULT 'user'
      `);
    }
  }

  if (await knex.schema.hasTable('expenses')) {
    if (!(await knex.schema.hasColumn('expenses', 'last_reminder_at'))) {
      await knex.schema.table('expenses', (table) => {
        table.timestamp('last_reminder_at').nullable();
      });
    }
    if (!(await knex.schema.hasColumn('expenses', 'reminder_count'))) {
      await knex.schema.table('expenses', (table) => {
        table.integer('reminder_count').unsigned().notNullable().defaultTo(0);
      });
    }
  }

  if (await knex.schema.hasTable('email_templates')) {
    const exists = await knex('email_templates').where({ name: 'approval_reminder' }).first();
    if (!exists) {
      await knex('email_templates').insert({
        name: 'approval_reminder',
        subject: 'Reminder: Approval Required for {{reference_number}}',
        body: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px;">
            <h2 style="color: #d97706;">Approval Reminder</h2>
            <p>This is a friendly reminder that the following petty cash request is still awaiting your approval.</p>
            <div style="background: #fffbeb; padding: 20px; border-radius: 10px; border: 1px solid #fde68a; margin: 20px 0;">
              <p><strong>Reference:</strong> {{reference_number}}</p>
              <p><strong>Amount:</strong> ₱{{amount}}</p>
              <p><strong>Requester:</strong> {{requested_by}}</p>
              <p><strong>Department:</strong> {{department}}</p>
              <p><strong>Remarks:</strong> {{remarks}}</p>
            </div>
            <p style="font-size: 12px; color: #64748b;">Please review and respond at your earliest convenience.</p>
            <p style="margin-top: 20px; font-size: 12px; color: #64748b;">NKB Petty Cash System</p>
          </div>
        `,
        type: 'approval'
      });
    }
  }
};

exports.down = async function (knex) {
  if (await knex.schema.hasTable('expenses')) {
    if (await knex.schema.hasColumn('expenses', 'last_reminder_at')) {
      await knex.schema.table('expenses', (table) => {
        table.dropColumn('last_reminder_at');
      });
    }
    if (await knex.schema.hasColumn('expenses', 'reminder_count')) {
      await knex.schema.table('expenses', (table) => {
        table.dropColumn('reminder_count');
      });
    }
  }

  if (await knex.schema.hasTable('email_templates')) {
    await knex('email_templates').where({ name: 'approval_reminder' }).del();
  }
};
