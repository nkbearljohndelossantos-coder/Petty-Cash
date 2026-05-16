exports.up = function(knex) {
  return knex.schema
    .createTableIfNotExists('departments', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('categories', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('description');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('users', (table) => {
      table.increments('id').primary();
      table.string('username').notNullable().unique();
      table.string('password').notNullable();
      table.string('full_name').notNullable();
      table.string('email').unique();
      table.enum('role', ['Super Admin', 'Accounting', 'Cashier', 'Manager', 'Viewer']).defaultTo('Viewer');
      table.integer('department_id').unsigned().references('id').inTable('departments').onDelete('SET NULL');
      table.boolean('status').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('expenses', (table) => {
      table.increments('id').primary();
      table.date('date').notNullable();
      table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('RESTRICT');
      table.text('remarks');
      table.string('requested_by'); // Manual input or user name
      table.integer('department_id').unsigned().references('id').inTable('departments').onDelete('RESTRICT');
      table.decimal('amount', 15, 2).notNullable();
      table.enum('status', ['Pending', 'Approved', 'Rejected', 'Liquidated']).defaultTo('Pending');
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('expense_attachments', (table) => {
      table.increments('id').primary();
      table.integer('expense_id').unsigned().references('id').inTable('expenses').onDelete('CASCADE');
      table.string('file_path').notNullable();
      table.string('file_name').notNullable();
      table.string('file_type');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('activity_logs', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('action').notNullable();
      table.text('details');
      table.string('ip_address');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTableIfNotExists('settings', (table) => {
      table.increments('id').primary();
      table.string('key').notNullable().unique();
      table.text('value');
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('settings')
    .dropTableIfExists('activity_logs')
    .dropTableIfExists('expense_attachments')
    .dropTableIfExists('expenses')
    .dropTableIfExists('users')
    .dropTableIfExists('categories')
    .dropTableIfExists('departments');
};
