const { format, subDays } = require('date-fns');

exports.seed = async function(knex) {
  const users = await knex('users').select('id');
  const categories = await knex('categories').select('id', 'name');
  const departments = await knex('departments').select('id', 'name');

  if (users.length === 0 || categories.length === 0) return;

  const adminId = users[0].id;
  const sampleExpenses = [];
  
  const requesters = [
    'Juan Dela Cruz', 'Maria Santos', 'Ricardo Dalisay', 
    'Liza Soberano', 'Enrique Gil', 'Coco Martin', 
    'Angel Locsin', 'Vice Ganda'
  ];

  const remarks = [
    'Fuel for delivery truck', 'Office supplies for accounting', 
    'Emergency plumbing repair', 'Client meeting lunch', 
    'Internet bill payment', 'Spare parts for production line',
    'Courier service fees', 'Team building snacks',
    'Hardware tools for maintenance', 'Utility bill - water'
  ];

  // Generate 60 days of data
  for (let i = 0; i < 60; i++) {
    const date = subDays(new Date(), i);
    const numDaily = Math.floor(Math.random() * 3) + 1; // 1-4 expenses per day

    for (let j = 0; j < numDaily; j++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      
      sampleExpenses.push({
        date: date,
        category_id: category.id,
        department_id: department.id,
        amount: Math.floor(Math.random() * 5000) + 150,
        remarks: remarks[Math.floor(Math.random() * remarks.length)],
        requested_by: requesters[Math.floor(Math.random() * requesters.length)],
        status: i < 7 ? (Math.random() > 0.5 ? 'Pending' : 'Approved') : (Math.random() > 0.2 ? 'Liquidated' : 'Approved'),
        created_by: adminId
      });
    }
  }

  // Deletes existing sample expenses to avoid duplicates if rerun
  // await knex('expenses').del(); 
  
  await knex('expenses').insert(sampleExpenses);
  
  console.log('Successfully injected 60 days of ERP sample data.');
};
