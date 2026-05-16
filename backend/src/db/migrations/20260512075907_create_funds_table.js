exports.up = function(knex) {
  return knex.schema.createTableIfNotExists('funds', table => {
    table.increments('id').primary();
    table.timestamp('date').defaultTo(knex.fn.now());
    table.decimal('amount', 15, 2).notNullable();
    table.string('reference_no');
    table.string('remarks');
    table.integer('added_by').unsigned().references('id').inTable('users');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('funds');
};
