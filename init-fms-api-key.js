const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected for FMS configuration...');
  
  const nodeScript = `
    const db = (await import('./db.js')).default;
    const hasTable = await db.schema.hasTable('api_keys');
    console.log('Has api_keys table:', hasTable);
    if (!hasTable) {
      await db.schema.createTable('api_keys', t => {
        t.increments('id').primary();
        t.string('key_name').notNullable();
        t.string('client_app').notNullable();
        t.string('api_key', 128).unique().notNullable();
        t.boolean('is_active').defaultTo(true);
        t.timestamp('last_used_at').nullable();
        t.timestamps(true, true);
      });
      console.log('Created api_keys table on FMS database!');
    }
    
    const existing = await db('api_keys').where({ api_key: 'nkb_inv_live_6ae6965c1ca61aef54939d6b1ecfac1b' }).first();
    if (!existing) {
      await db('api_keys').insert({
        key_name: 'Petty Cash Integration Key',
        client_app: 'Petty Cash',
        api_key: 'nkb_inv_live_6ae6965c1ca61aef54939d6b1ecfac1b',
        is_active: true
      });
      console.log('Inserted Petty Cash API key into FMS database!');
    } else {
      await db('api_keys').where({ api_key: 'nkb_inv_live_6ae6965c1ca61aef54939d6b1ecfac1b' }).update({ is_active: true });
      console.log('FMS API Key is already present and active!');
    }
    process.exit(0);
  `.replace(/\n\s+/g, ' ');

  const cmd = `cd /home/u335953510/domains/fms.nkbmanufacturing.com/hbuilds/versions/01a0fa8a-1b7f-7309-904b-554ce984dcd1/nodejs/server && NODE_ENV=production /opt/alt/alt-nodejs20/root/bin/node --input-type=module -e "${nodeScript}"`;

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    stream.on('data', data => process.stdout.write(data));
    stream.stderr.on('data', data => process.stderr.write(data));
    stream.on('close', () => {
      conn.end();
    });
  });
}).connect({
  host: '187.127.126.44',
  port: 65002,
  username: 'u335953510',
  password: 'NkbManufacturing@2026'
});
