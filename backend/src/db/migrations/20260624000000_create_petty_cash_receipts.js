exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('petty_cash_receipts');
  if (exists) return;

  await knex.schema.createTable('petty_cash_receipts', (table) => {
    table.increments('id').primary();
    table.integer('transaction_id').unsigned().notNullable().references('id').inTable('expenses').onDelete('CASCADE');
    table.string('original_filename', 255).notNullable();
    table.string('stored_filename', 255).notNullable().unique();
    table.string('file_path', 500).notNullable();
    table.string('file_type', 100).notNullable();
    table.integer('file_size').unsigned().notNullable();
    table.integer('uploaded_by').unsigned().notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.timestamp('uploaded_at').defaultTo(knex.fn.now());
    table.integer('deleted_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('deleted_at').nullable();
    table.string('ip_address', 64).nullable();
    table.string('deleted_ip_address', 64).nullable();
    table.index(['transaction_id', 'deleted_at']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('petty_cash_receipts');
};
