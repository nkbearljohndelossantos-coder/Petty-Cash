exports.up = async function (knex) {
  // 1. Create payables table
  if (!(await knex.schema.hasTable('payables'))) {
    await knex.schema.createTable('payables', (table) => {
      table.increments('id').primary();
      table.string('requisition_no', 50).notNullable().unique();
      table.string('supplier_name', 150).notNullable();
      table.string('invoice_no', 100).nullable();
      table.integer('department_id').unsigned().nullable().index();
      table.integer('user_id').unsigned().nullable().index();
      table.decimal('gross_amount', 12, 2).notNullable();
      table.decimal('ewt_rate', 5, 2).defaultTo(0.00);
      table.decimal('ewt_amount', 12, 2).defaultTo(0.00);
      table.decimal('net_amount', 12, 2).notNullable();
      table.date('due_date').nullable();
      table.string('status', 50).notNullable().defaultTo('Pending Approval');
      table.integer('approved_by').unsigned().nullable().index();
      table.timestamp('approved_at').nullable();
      table.integer('coo_confirmed_by').unsigned().nullable().index();
      table.timestamp('coo_confirmed_at').nullable();
      table.text('rejection_reason').nullable();
      table.text('remarks').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.index(['status', 'due_date']);
    });
  }

  // 2. Create payable_attachments table
  if (!(await knex.schema.hasTable('payable_attachments'))) {
    await knex.schema.createTable('payable_attachments', (table) => {
      table.increments('id').primary();
      table.integer('payable_id').unsigned().notNullable().index();
      table.string('file_name', 255).notNullable();
      table.string('file_path', 255).notNullable();
      table.integer('file_size').nullable();
      table.string('file_type', 100).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 3. Create cheque_issuances table
  if (!(await knex.schema.hasTable('cheque_issuances'))) {
    await knex.schema.createTable('cheque_issuances', (table) => {
      table.increments('id').primary();
      table.integer('payable_id').unsigned().notNullable().index();
      table.string('bank_name', 100).notNullable();
      table.string('cheque_number', 100).notNullable();
      table.date('cheque_date').notNullable();
      table.string('released_to', 150).nullable();
      table.timestamp('released_at').nullable();
      table.timestamp('cleared_at').nullable();
      table.integer('issued_by').unsigned().nullable().index();
      table.text('remarks').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index(['cheque_number', 'bank_name']);
    });
  }

  // 4. Create payable_approval_tokens table (for email/webhook approval relaying)
  if (!(await knex.schema.hasTable('payable_approval_tokens'))) {
    await knex.schema.createTable('payable_approval_tokens', (table) => {
      table.increments('id').primary();
      table.integer('payable_id').unsigned().notNullable().index();
      table.string('token', 255).notNullable().unique();
      table.string('action', 50).notNullable(); // APPROVE, REJECT, COO_CONFIRM
      table.string('approver_email', 150).nullable();
      table.integer('approver_id').unsigned().nullable().index();
      table.timestamp('expires_at').notNullable();
      table.boolean('used').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('payable_approval_tokens');
  await knex.schema.dropTableIfExists('cheque_issuances');
  await knex.schema.dropTableIfExists('payable_attachments');
  await knex.schema.dropTableIfExists('payables');
};
