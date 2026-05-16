const knex = require('./src/config/db');

async function migrate() {
  console.log('Starting migrations...');
  try {
    const [batchNo, log] = await knex.migrate.latest();
    if (log.length === 0) {
      console.log('Database is already up to date.');
    } else {
      console.log('Batch ' + batchNo + ' run: ' + log.length + ' migrations');
      console.log(log.join('\n'));
    }
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    process.exit();
  }
}

migrate();
