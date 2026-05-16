/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasBrand = await knex.schema.hasColumn('expenses', 'brand');
  if (!hasBrand) {
    await knex.schema.table('expenses', table => {
      table.string('brand').nullable();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('expenses', table => {
    table.dropColumn('brand');
  });
};
