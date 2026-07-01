exports.up = async function(knex) {
  // Ensure the amount column is decimal(15,2)
  await knex.schema.alterTable('expenses', (table) => {
    table.decimal('amount', 15, 2).notNullable().alter();
  });
};

exports.down = function(knex) {
  // In reverse, we can just leave it as is
  return knex.schema.alterTable('expenses', (table) => {
    table.decimal('amount', 15, 2).notNullable().alter();
  });
};
