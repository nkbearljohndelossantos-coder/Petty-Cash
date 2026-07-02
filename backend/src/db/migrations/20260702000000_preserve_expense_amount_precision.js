exports.up = async function(knex) {
  await knex.schema.alterTable('expenses', (table) => {
    table.decimal('amount', 15, 6).notNullable().alter();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('expenses', (table) => {
    table.decimal('amount', 15, 2).notNullable().alter();
  });
};
