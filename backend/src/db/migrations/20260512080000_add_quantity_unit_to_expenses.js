
exports.up = function(knex) {
  return knex.schema.table('expenses', table => {
    table.integer('quantity').defaultTo(1);
    table.string('unit').defaultTo('Piece');
  });
};

exports.down = function(knex) {
  return knex.schema.table('expenses', table => {
    table.dropColumn('quantity');
    table.dropColumn('unit');
  });
};
