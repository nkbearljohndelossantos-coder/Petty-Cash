const db = require('./src/config/db');

async function createLogsTable() {
  const hasTable = await db.schema.hasTable('activity_logs');
  if (!hasTable) {
    await db.schema.createTable('activity_logs', table => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
      table.string('action'); // e.g., 'LOGIN', 'CREATE_EXPENSE', 'APPROVE_EXPENSE'
      table.text('details');
      table.string('ip_address');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('Activity Logs table created.');
  }
}

createLogsTable().then(() => process.exit());
