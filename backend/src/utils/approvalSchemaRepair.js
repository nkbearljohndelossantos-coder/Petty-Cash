/**
 * Idempotent schema repair for liquidation approval workflow.
 * Safe to run on every server start — fixes Hostinger deployments
 * where knex migration history is out of sync with actual schema.
 */
async function ensureApprovalSchema(db) {
  try {
    const hasExpenses = await db.schema.hasTable('expenses');
    if (!hasExpenses) return;

    // Use VARCHAR instead of ENUM — avoids Hostinger/MySQL ENUM alter failures
    const [statusCol] = await db.raw("SHOW COLUMNS FROM expenses LIKE 'status'");
    const statusType = statusCol?.[0]?.Type || '';
    if (statusType.startsWith('enum')) {
      console.log('REPAIR: Converting expenses.status from ENUM to VARCHAR(50)...');
      await db.raw(`
        ALTER TABLE expenses
        MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Pending'
      `);
    }

    if (!(await db.schema.hasColumn('expenses', 'current_approval_level'))) {
      console.log('REPAIR: Adding approval columns to expenses table...');
      await db.schema.table('expenses', (table) => {
        table.integer('current_approval_level').unsigned().defaultTo(0);
        table.integer('submitted_by').unsigned().nullable();
        table.timestamp('submitted_at').nullable();
        table.string('approval_context', 20).nullable();
      });
    }

    if (!(await db.schema.hasTable('liquidation_approvers'))) {
      console.log('REPAIR: Creating liquidation_approvers table...');
      await db.schema.createTable('liquidation_approvers', (table) => {
        table.increments('id').primary();
        table.string('email').notNullable();
        table.string('name').nullable();
        table.integer('approval_level').unsigned().notNullable().defaultTo(1);
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
      });
    }

    if (!(await db.schema.hasTable('liquidation_approval_tokens'))) {
      console.log('REPAIR: Creating liquidation_approval_tokens table...');
      await db.schema.createTable('liquidation_approval_tokens', (table) => {
        table.increments('id').primary();
        table.integer('expense_id').unsigned().notNullable();
        table.string('token_hash', 64).notNullable().unique();
        table.string('action_type', 20).notNullable();
        table.integer('approval_level').unsigned().notNullable().defaultTo(1);
        table.timestamp('expires_at').notNullable();
        table.timestamp('used_at').nullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.index(['expense_id', 'action_type']);
      });
    }

    if (!(await db.schema.hasTable('liquidation_approval_audit'))) {
      console.log('REPAIR: Creating liquidation_approval_audit table...');
      await db.schema.createTable('liquidation_approval_audit', (table) => {
        table.increments('id').primary();
        table.integer('expense_id').unsigned().notNullable();
        table.string('action', 20).notNullable();
        table.string('actor_type', 10).notNullable().defaultTo('user');
        table.integer('actor_user_id').unsigned().nullable();
        table.string('actor_email').nullable();
        table.string('actor_name').nullable();
        table.string('ip_address', 45).nullable();
        table.text('decline_reason').nullable();
        table.integer('approval_level').unsigned().defaultTo(1);
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.index(['expense_id', 'created_at']);
      });
    }

    const defaultSettings = [
      { key: 'liquidation_approval_threshold', value: '10000' },
      { key: 'liquidation_approval_email_enabled', value: 'true' },
      { key: 'liquidation_approval_recipient_email', value: '' }
    ];

    if (await db.schema.hasTable('settings')) {
      for (const setting of defaultSettings) {
        const exists = await db('settings').where({ key: setting.key }).first();
        if (!exists) {
          await db('settings').insert(setting);
        }
      }
    }

    console.log('REPAIR: Liquidation approval schema is up to date.');
  } catch (err) {
    console.error('REPAIR: Approval schema repair failed:', err.message);
  }
}

module.exports = { ensureApprovalSchema };
