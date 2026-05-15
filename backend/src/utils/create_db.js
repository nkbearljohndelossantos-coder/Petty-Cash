const { Client } = require('pg');

async function createDatabase() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    port: 5432,
    // Try without password or with common defaults
    password: '', 
  });

  try {
    await client.connect();
    await client.query('CREATE DATABASE nkb_petty_cash');
    console.log('Database nkb_petty_cash created successfully!');
  } catch (err) {
    if (err.code === '42P04') {
      console.log('Database nkb_petty_cash already exists.');
    } else {
      console.error('Error creating database:', err.message);
      console.log('Please make sure PostgreSQL is running and you have the correct password.');
    }
  } finally {
    await client.end();
  }
}

createDatabase();
