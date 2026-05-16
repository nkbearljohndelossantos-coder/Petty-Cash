exports.up = async function(knex) {
  const hasQuantity = await knex.schema.hasColumn('expenses', 'quantity');
  if (!hasQuantity) {
    await knex.schema.table('expenses', table => {
      table.integer('quantity').defaultTo(1);
    });
  }

  const hasUnit = await knex.schema.hasColumn('expenses', 'unit');
  if (!hasUnit) {
    await knex.schema.table('expenses', table => {
      table.string('unit').defaultTo('Piece');
    });
  }
};

exports.down = function(knex) {
  return knex.schema.table('expenses', table => {
    table.dropColumn('quantity');
    table.dropColumn('unit');
  });
};
