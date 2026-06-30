const { Client } = require('ssh2');
const conn = new Client();
const NODE = '/opt/alt/alt-nodejs20/root/bin/node';
const NODEJS = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs';

const cmds = [
  `ps aux | grep lsnode | grep pc.nkb | head -5`,
  `cat ${NODEJS}/console.log | tail -20`,
  `kill $(pgrep -f "lsnode.*pc.nkbmanufacturing") 2>/dev/null; echo killed`,
  `cd ${NODEJS} && nohup ${NODE} src/index.js > console.log 2>&1 & echo "Started PID=$!"`,
  `sleep 4 && ps aux | grep lsnode | grep pc.nkb | head -3`,
  `curl -s http://127.0.0.1:5000/api/auth/login -X POST -H 'Content-Type: application/json' -d '{"username":"admin","password":"NKB@2026"}' 2>&1 | head -c 200`,
];

conn.on('ready', () => {
  console.log('SSH Connected!');
  let i = 0;
  const run = () => {
    if (i >= cmds.length) { conn.end(); return; }
    const cmd = cmds[i++];
    console.log('\n>>>', cmd);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error('Error:', err.message); run(); return; }
      stream.on('data', d => process.stdout.write(d.toString()))
            .on('stderr', d => process.stderr.write(d.toString()))
            .on('close', () => run());
    });
  };
  run();
}).on('error', err => {
  console.error('SSH Error:', err.message);
}).connect({
  host: '187.127.126.44', port: 65002,
  username: 'u335953510', password: 'NkbManufacturing@2026',
  readyTimeout: 60000
});
