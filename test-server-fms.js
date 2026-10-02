const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected! Running live test on server...');
  
  const scriptContent = `
    const { testFmsConnection, sendPayableToFms } = require('./src/services/fmsService');
    const db = require('./src/config/db');

    (async () => {
      try {
        console.log('--- Testing FMS Connectivity ---');
        const testRes = await testFmsConnection();
        console.log('Connectivity Test Result:', JSON.stringify(testRes, null, 2));

        console.log('--- Testing Sending Latest Payable to FMS ---');
        const latestPayable = await db('payables').orderBy('id', 'desc').first();
        if (latestPayable) {
          console.log('Found latest payable:', latestPayable.requisition_no);
          const syncRes = await sendPayableToFms(latestPayable);
          console.log('Sync Result for ' + latestPayable.requisition_no + ':', JSON.stringify(syncRes, null, 2));
        } else {
          console.log('No payables found in database to test.');
        }
      } catch (err) {
        console.error('Test script error:', err);
      } finally {
        process.exit(0);
      }
    })();
  `.replace(/\n\s+/g, ' ');

  const cmd = `cd /home/u335953510/domains/pc.nkbmanufacturing.com/hbuilds/current/nodejs && NODE_ENV=production /opt/alt/alt-nodejs20/root/bin/node -e "${scriptContent}"`;

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.126.44',
  port: 65002,
  username: 'u335953510',
  password: 'NkbManufacturing@2026'
});
