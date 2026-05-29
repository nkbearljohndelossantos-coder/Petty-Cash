const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('activity_logs').del();
  await knex('expense_attachments').del();
  await knex('expenses').del();
  await knex('users').del();
  await knex('categories').del();
  await knex('departments').del();
  await knex('settings').del();

  // Inserts departments
  const [dept1] = await knex('departments').insert([
    { name: 'Accounting' },
    { name: 'Production' },
    { name: 'Logistics' },
    { name: 'HR' },
    { name: 'Maintenance' },
    { name: 'Quality Control' },
    { name: 'Warehouse' },
    { name: 'Purchasing' },
    { name: 'Administration' },
    { name: 'R&D' },
    { name: 'Sales' },
    { name: 'IT' },
    { name: 'Engineering' },
    { name: 'Audit' },
  ]).returning('id');

  // Inserts categories
  await knex('categories').insert([
    { name: 'GAS' },
    { name: 'TRANSPO' },
    { name: 'MEAL ALLOWANCE' },
    { name: 'MAINTENANCE' },
    { name: 'PAYMENT' },
    { name: 'LAB' },
    { name: 'HVAC' },
    { name: 'ICT' },
    { name: 'LOGISTICS' },
    { name: 'PRODUCTION' },
    { name: 'MERALCO' },
    { name: 'RAW PAYMENTS' },
    { name: 'PERSONAL' },
    { name: 'PANTRY' },
    { name: 'TOLL' },
    { name: 'BANK' },
    { name: 'FDA' },
    { name: 'OTHER' },
  ]);

  // Inserts default Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await knex('users').insert({
    username: 'admin',
    password: hashedPassword,
    full_name: 'System Administrator',
    email: 'admin@nkbmanufacturing.com',
    role: 'Super Admin',
    department_id: dept1.id,
    status: true
  });

  // Inserts default settings
  await knex('settings').insert([
    { key: 'company_name', value: 'NKB Manufacturing' },
    { key: 'currency', value: 'PHP' },
    { key: 'theme', value: 'light' },
    { key: 'expense_units', value: JSON.stringify(['Box', 'Ream', 'Piece', 'Kilogram', 'Drums', 'Container', 'Gallon', 'Bag', 'Pouches', 'Bottle']) },
  ]);
};
