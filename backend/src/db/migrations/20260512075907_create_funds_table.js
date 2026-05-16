exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('funds');
  if (!hasTable) {
    await knex.schema.createTable('funds', table => {
      table.increments('id').primary();
      table.timestamp('date').defaultTo(knex.fn.now());
      table.decimal('amount', 15, 2).notNullable();
      table.string('reference_no');
      table.string('remarks');
      table.integer('added_by').unsigned().references('id').inTable('users');
      table.timestamps(true, true);
    });
  } else {
    // Table exists, check for missing columns
    if (!(await knex.schema.hasColumn('funds', 'date'))) {
      await knex.schema.table('funds', t => t.timestamp('date').defaultTo(knex.fn.now()));
    }
    if (!(await knex.schema.hasColumn('funds', 'amount'))) {
      await knex.schema.table('funds', t => t.decimal('amount', 15, 2).notNullable().defaultTo(0));
    }
    if (!(await knex.schema.hasColumn('funds', 'reference_no'))) {
      await knex.schema.table('funds', t => t.string('reference_no'));
    }
    if (!(await knex.schema.hasColumn('funds', 'remarks'))) {
      await knex.schema.table('funds', t => t.string('remarks'));
    }
    if (!(await knex.schema.hasColumn('funds', 'added_by'))) {
      await knex.schema.table('funds', t => t.integer('added_by').unsigned().references('id').inTable('users'));
    }
    if (!(await knex.schema.hasColumn('funds', 'created_at'))) {
      await knex.schema.table('funds', t => t.timestamps(true, true));
    }
  }
};

exports.down = function(knex) {
  return knex.schema.dropTable('funds');
};
