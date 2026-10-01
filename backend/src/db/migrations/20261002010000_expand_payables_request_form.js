exports.up = async function (knex) {
  // 1. Add form columns to payables
  if (await knex.schema.hasTable('payables')) {
    await knex.schema.table('payables', (table) => {
      table.string('company', 150).defaultTo('NKB Manufacturing Corporation');
      table.string('payable_category', 100).defaultTo('Trade payable');
      table.date('invoice_date').nullable();
      table.string('control_number', 100).nullable();
      table.string('term', 50).defaultTo('Net 30');
      table.text('description').nullable();
      table.string('bank_account', 255).nullable();
      table.text('comments').nullable();
    });
  }

  // 2. Create payable_items table
  if (!(await knex.schema.hasTable('payable_items'))) {
    await knex.schema.createTable('payable_items', (table) => {
      table.increments('id').primary();
      table.integer('payable_id').unsigned().notNullable().index();
      table.string('description', 255).notNullable();
      table.string('expense_category', 100).defaultTo('Raw Materials');
      table.decimal('quantity', 10, 2).defaultTo(1);
      table.decimal('cost', 12, 2).defaultTo(0.00);
      table.decimal('subtotal', 12, 2).defaultTo(0.00);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('payable_items');
  if (await knex.schema.hasTable('payables')) {
    await knex.schema.table('payables', (table) => {
      table.dropColumn('company');
      table.dropColumn('payable_category');
      table.dropColumn('invoice_date');
      table.dropColumn('control_number');
      table.dropColumn('term');
      table.dropColumn('description');
      table.dropColumn('bank_account');
      table.dropColumn('comments');
    });
  }
};
