const { Client } = require('ssh2');
const conn = new Client();
const NODEJS = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs';
const NODE = '/opt/alt/alt-nodejs20/root/bin/node';

const commands = [
  `pkill -f "node.*src/index.js" 2>/dev/null; sleep 1; echo "Killed old processes"`,
  `lsof -i :5000 2>/dev/null || echo "Port 5000 is free"`,
  `cd ${NODEJS} && nohup ${NODE} src/index.js > console.log 2>&1 & sleep 3; echo "Started new process"`,
  `tail -15 ${NODEJS}/console.log`,
  `ps aux | grep "node.*index.js" | grep -v grep | head -3`,
  `curl -s http://localhost:5000/api/auth/login -X POST -H "Content-Type: application/json" -d '{}' 2>&1 | head -5`,
];

conn.on('ready', () => {
  console.log('SSH Connected!');
  let i = 0;
  const runNext = () => {
    if (i >= commands.length) { conn.end(); return; }
    const cmd = commands[i++];
    console.log(`\n>>> ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error('Error:', err.message); runNext(); return; }
      stream.on('data', (d) => process.stdout.write(d.toString()))
            .on('stderr', (d) => process.stderr.write(d.toString()))
            .on('close', (code) => { console.log(`[exit: ${code}]`); runNext(); });
    });
  };
  runNext();
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
  process.exit(1);
}).connect({
  host: '187.127.126.44', port: 65002,
  username: 'u335953510', password: 'NkbManufacturing@2026',
  readyTimeout: 30000, keepaliveInterval: 10000
});