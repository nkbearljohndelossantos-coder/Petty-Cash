exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('notes');
  if (exists) return;

  await knex.schema.createTable('notes', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description');
    table.timestamps(true, true); // created_at and updated_at
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('notes');
};
