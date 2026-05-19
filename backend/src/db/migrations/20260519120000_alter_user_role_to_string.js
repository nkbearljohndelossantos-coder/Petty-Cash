exports.up = async function(knex) {
  // Alter user role column to a VARCHAR/string type for high flexibility and to prevent strict ENUM crashes
  await knex.schema.table('users', (table) => {
    table.string('role', 50).defaultTo('Staff').alter();
  });
};

exports.down = async function(knex) {
  // Rollback to original enum schema definition
  await knex.schema.table('users', (table) => {
    table.enum('role', ['Super Admin', 'Accounting', 'Cashier', 'Manager', 'Viewer']).defaultTo('Viewer').alter();
  });
};
