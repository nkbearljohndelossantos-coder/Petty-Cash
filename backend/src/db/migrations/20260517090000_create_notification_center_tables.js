exports.up = async function(knex) {
  // 1. notification_templates Table
  if (!(await knex.schema.hasTable('notification_templates'))) {
    await knex.schema.createTable('notification_templates', (table) => {
      table.increments('id').primary();
      table.string('name', 255).notNullable().unique();
      table.string('subject', 255).notNullable();
      table.text('body').notNullable();
      table.string('type', 50).notNullable().defaultTo('info'); // info, success, warning, error, approval, finance
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // 2. Add high-level columns to the existing notifications table if they don't exist
  await knex.schema.alterTable('notifications', (table) => {
    if (!knex.schema.hasColumn('notifications', 'priority')) {
      table.string('priority', 20).defaultTo('normal'); // normal, important, critical
    }
    if (!knex.schema.hasColumn('notifications', 'sender_id')) {
      table.integer('sender_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    }
    if (!knex.schema.hasColumn('notifications', 'attachment_url')) {
      table.string('attachment_url', 500).nullable();
    }
    if (!knex.schema.hasColumn('notifications', 'task_link')) {
      table.string('task_link', 255).nullable();
    }
    if (!knex.schema.hasColumn('notifications', 'acknowledged')) {
      table.boolean('acknowledged').defaultTo(false);
    }
    if (!knex.schema.hasColumn('notifications', 'archived')) {
      table.boolean('archived').defaultTo(false);
    }
    if (!knex.schema.hasColumn('notifications', 'category')) {
      table.string('category', 50).defaultTo('general'); // general, approval, finance, alert
    }
  });

  // 3. notification_recipients Table (multi-recipient targeting)
  if (!(await knex.schema.hasTable('notification_recipients'))) {
    await knex.schema.createTable('notification_recipients', (table) => {
      table.increments('id').primary();
      table.integer('notification_id').unsigned().references('id').inTable('notifications').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('status', 20).defaultTo('pending'); // pending, sent, failed
      table.timestamp('created_at').defaultTo(knex.fn.now());

      // Indexes for MySQL performance
      table.index(['notification_id']);
      table.index(['user_id']);
    });
  }

  // 4. notification_reads Table (Detailed read and acknowledge tracking)
  if (!(await knex.schema.hasTable('notification_reads'))) {
    await knex.schema.createTable('notification_reads', (table) => {
      table.increments('id').primary();
      table.integer('notification_id').unsigned().references('id').inTable('notifications').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.timestamp('read_at').nullable();
      table.timestamp('acknowledged_at').nullable();
      table.string('status', 20).defaultTo('sent'); // sent, delivered, read, acknowledged
      table.timestamp('created_at').defaultTo(knex.fn.now());

      // Indexes for MySQL performance
      table.index(['notification_id']);
      table.index(['user_id']);
      table.unique(['notification_id', 'user_id']); // Ensure only one tracking row per user-notification pair
    });
  }

  // 5. notification_schedule Table (scheduling service)
  if (!(await knex.schema.hasTable('notification_schedule'))) {
    await knex.schema.createTable('notification_schedule', (table) => {
      table.increments('id').primary();
      table.integer('template_id').unsigned().references('id').inTable('notification_templates').onDelete('SET NULL');
      table.string('title', 255).notNullable();
      table.text('message').notNullable();
      table.string('priority', 20).defaultTo('normal'); // normal, important, critical
      table.string('recipients_type', 20).defaultTo('all'); // all, department, users
      table.text('recipients_data').nullable(); // JSON list of user ids or department strings
      table.timestamp('schedule_time').notNullable();
      table.string('frequency', 20).defaultTo('once'); // once, daily, weekly, monthly
      table.string('status', 20).defaultTo('active'); // active, completed, paused
      table.timestamp('last_run').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['schedule_time']);
    });
  }
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('notification_schedule')
    .dropTableIfExists('notification_reads')
    .dropTableIfExists('notification_recipients')
    .alterTable('notifications', (table) => {
      table.dropColumn('category');
      table.dropColumn('archived');
      table.dropColumn('acknowledged');
      table.dropColumn('task_link');
      table.dropColumn('attachment_url');
      table.dropColumn('sender_id');
      table.dropColumn('priority');
    })
    .dropTableIfExists('notification_templates');
};
