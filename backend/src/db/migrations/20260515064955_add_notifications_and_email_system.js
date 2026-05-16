exports.up = async function(knex) {
  // 1. email_templates
  if (!(await knex.schema.hasTable('email_templates'))) {
    await knex.schema.createTable('email_templates', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('subject').notNullable();
      table.text('body').notNullable(); // HTML body with placeholders
      table.string('type').notNullable(); // e.g., 'expense_status', 'low_fund', 'report'
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // 2. email_logs
  if (!(await knex.schema.hasTable('email_logs'))) {
    await knex.schema.createTable('email_logs', (table) => {
      table.increments('id').primary();
      table.string('recipient').notNullable();
      table.string('subject').notNullable();
      table.text('body');
      table.enum('status', ['pending', 'sent', 'failed', 'cancelled']).defaultTo('pending');
      table.text('error_message');
      table.integer('retry_count').defaultTo(0);
      table.jsonb('attachments');
      table.timestamp('sent_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 3. scheduled_emails
  if (!(await knex.schema.hasTable('scheduled_emails'))) {
    await knex.schema.createTable('scheduled_emails', (table) => {
      table.increments('id').primary();
      table.integer('template_id').unsigned().references('id').inTable('email_templates').onDelete('CASCADE');
      table.string('recipient').notNullable();
      table.timestamp('schedule_time').notNullable();
      table.string('frequency').defaultTo('once'); // once, daily, weekly, monthly
      table.jsonb('data'); // Placeholder data
      table.enum('status', ['active', 'completed', 'paused']).defaultTo('active');
      table.timestamp('last_run');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 4. notification_rules
  if (!(await knex.schema.hasTable('notification_rules'))) {
    await knex.schema.createTable('notification_rules', (table) => {
      table.increments('id').primary();
      table.string('event_type').notNullable(); // expense_submitted, low_fund, etc.
      table.boolean('email_enabled').defaultTo(true);
      table.boolean('in_app_enabled').defaultTo(true);
      table.integer('template_id').unsigned().references('id').inTable('email_templates').onDelete('SET NULL');
      table.jsonb('config'); // e.g., { threshold: 5000 }
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 5. notifications
  if (!(await knex.schema.hasTable('notifications'))) {
    await knex.schema.createTable('notifications', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.string('title').notNullable();
      table.text('message').notNullable();
      table.enum('type', ['info', 'success', 'warning', 'error', 'approval', 'finance', 'audit']).defaultTo('info');
      table.boolean('is_read').defaultTo(false);
      table.string('link'); // URL to redirect
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 6. notification_preferences
  if (!(await knex.schema.hasTable('notification_preferences'))) {
    await knex.schema.createTable('notification_preferences', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').unique();
      table.boolean('email_enabled').defaultTo(true);
      table.boolean('in_app_enabled').defaultTo(true);
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // 7. queue_fallback_jobs
  if (!(await knex.schema.hasTable('queue_fallback_jobs'))) {
    await knex.schema.createTable('queue_fallback_jobs', (table) => {
      table.increments('id').primary();
      table.string('queue_name').notNullable();
      table.string('job_name').notNullable();
      table.jsonb('data');
      table.integer('priority').defaultTo(0);
      table.integer('attempts').defaultTo(0);
      table.enum('status', ['pending', 'failed', 'completed']).defaultTo('pending');
      table.timestamp('next_run_at').defaultTo(knex.fn.now());
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('queue_fallback_jobs')
    .dropTableIfExists('notification_preferences')
    .dropTableIfExists('notifications')
    .dropTableIfExists('notification_rules')
    .dropTableIfExists('scheduled_emails')
    .dropTableIfExists('email_logs')
    .dropTableIfExists('email_templates');
};
