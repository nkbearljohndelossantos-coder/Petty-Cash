exports.up = async function(knex) {
  // Departments
  if (!(await knex.schema.hasTable('departments'))) {
    await knex.schema.createTable('departments', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  } else {
    if (!(await knex.schema.hasColumn('departments', 'name'))) {
      await knex.schema.table('departments', t => t.string('name').notNullable().unique());
    }
    if (!(await knex.schema.hasColumn('departments', 'created_at'))) {
      await knex.schema.table('departments', t => t.timestamp('created_at').defaultTo(knex.fn.now()));
    }
  }

  // Categories
  if (!(await knex.schema.hasTable('categories'))) {
    await knex.schema.createTable('categories', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('description');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  } else {
    if (!(await knex.schema.hasColumn('categories', 'name'))) {
      await knex.schema.table('categories', t => t.string('name').notNullable().unique());
    }
    if (!(await knex.schema.hasColumn('categories', 'description'))) {
      await knex.schema.table('categories', t => t.string('description'));
    }
    if (!(await knex.schema.hasColumn('categories', 'created_at'))) {
      await knex.schema.table('categories', t => t.timestamp('created_at').defaultTo(knex.fn.now()));
    }
  }

  // Users
  if (!(await knex.schema.hasTable('users'))) {
    await knex.schema.createTable('users', (table) => {
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
    });
  } else {
    // Repair users table
    if (!(await knex.schema.hasColumn('users', 'username'))) {
      await knex.schema.table('users', t => t.string('username').notNullable().unique());
    }
    if (!(await knex.schema.hasColumn('users', 'password'))) {
      await knex.schema.table('users', t => t.string('password').notNullable());
    }
    if (!(await knex.schema.hasColumn('users', 'full_name'))) {
      await knex.schema.table('users', t => t.string('full_name').notNullable());
    }
    if (!(await knex.schema.hasColumn('users', 'email'))) {
      await knex.schema.table('users', t => t.string('email').unique());
    }
    if (!(await knex.schema.hasColumn('users', 'role'))) {
      await knex.schema.table('users', t => t.enum('role', ['Super Admin', 'Accounting', 'Cashier', 'Manager', 'Viewer']).defaultTo('Viewer'));
    }
    if (!(await knex.schema.hasColumn('users', 'department_id'))) {
      await knex.schema.table('users', t => t.integer('department_id').unsigned().references('id').inTable('departments').onDelete('SET NULL'));
    }
    if (!(await knex.schema.hasColumn('users', 'status'))) {
      await knex.schema.table('users', t => t.boolean('status').defaultTo(true));
    }
    if (!(await knex.schema.hasColumn('users', 'created_at'))) {
      await knex.schema.table('users', t => t.timestamp('created_at').defaultTo(knex.fn.now()));
    }
    if (!(await knex.schema.hasColumn('users', 'updated_at'))) {
      await knex.schema.table('users', t => t.timestamp('updated_at').defaultTo(knex.fn.now()));
    }
  }

  // Expenses
  if (!(await knex.schema.hasTable('expenses'))) {
    await knex.schema.createTable('expenses', (table) => {
      table.increments('id').primary();
      table.date('date').notNullable();
      table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('RESTRICT');
      table.text('remarks');
      table.string('requested_by');
      table.integer('department_id').unsigned().references('id').inTable('departments').onDelete('RESTRICT');
      table.decimal('amount', 15, 2).notNullable();
      table.enum('status', ['Pending', 'Approved', 'Rejected', 'Liquidated']).defaultTo('Pending');
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  } else {
    // Basic repair for expenses
    if (!(await knex.schema.hasColumn('expenses', 'date'))) {
      await knex.schema.table('expenses', t => t.date('date').notNullable());
    }
    if (!(await knex.schema.hasColumn('expenses', 'category_id'))) {
      await knex.schema.table('expenses', t => t.integer('category_id').unsigned().references('id').inTable('categories').onDelete('RESTRICT'));
    }
    if (!(await knex.schema.hasColumn('expenses', 'amount'))) {
      await knex.schema.table('expenses', t => t.decimal('amount', 15, 2).notNullable().defaultTo(0));
    }
    if (!(await knex.schema.hasColumn('expenses', 'status'))) {
      await knex.schema.table('expenses', t => t.enum('status', ['Pending', 'Approved', 'Rejected', 'Liquidated']).defaultTo('Pending'));
    }
  }

  // Expense Attachments
  if (!(await knex.schema.hasTable('expense_attachments'))) {
    await knex.schema.createTable('expense_attachments', (table) => {
      table.increments('id').primary();
      table.integer('expense_id').unsigned().references('id').inTable('expenses').onDelete('CASCADE');
      table.string('file_path').notNullable();
      table.string('file_name').notNullable();
      table.string('file_type');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // Activity Logs
  if (!(await knex.schema.hasTable('activity_logs'))) {
    await knex.schema.createTable('activity_logs', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.string('action').notNullable();
      table.text('details');
      table.string('ip_address');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // Settings
  if (!(await knex.schema.hasTable('settings'))) {
    await knex.schema.createTable('settings', (table) => {
      table.increments('id').primary();
      table.string('key').notNullable().unique();
      table.text('value');
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
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
