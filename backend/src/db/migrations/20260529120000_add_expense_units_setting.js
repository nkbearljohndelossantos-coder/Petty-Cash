const DEFAULT_UNITS = JSON.stringify([
  'Box', 'Ream', 'Piece', 'Kilogram', 'Drums', 'Container', 'Gallon', 'Bag', 'Pouches', 'Bottle'
]);

const EXTRA_DEPARTMENTS = [
  'Quality Control',
  'Warehouse',
  'Purchasing',
  'Administration',
  'R&D',
  'Sales',
  'IT',
  'Engineering',
  'Audit'
];

exports.up = async function (knex) {
  const existing = await knex('settings').where({ key: 'expense_units' }).first();
  if (!existing) {
    await knex('settings').insert({ key: 'expense_units', value: DEFAULT_UNITS });
  }

  for (const name of EXTRA_DEPARTMENTS) {
    const dept = await knex('departments').where({ name }).first();
    if (!dept) {
      await knex('departments').insert({ name });
    }
  }
};

exports.down = async function (knex) {
  await knex('settings').where({ key: 'expense_units' }).del();
};
