const { Client } = require('ssh2');
const conn = new Client();

const TEMP = '/home/u335953510/domains/pc.nkbmanufacturing.com/temp_deploy';
const NODEJS = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs';
const PUBLIC = '/home/u335953510/domains/pc.nkbmanufacturing.com/public_html';
const NODE = '/opt/alt/alt-nodejs20/root/bin/node';
const NPM = '/opt/alt/alt-nodejs20/root/bin/npm';

const commands = [
  `cd ${TEMP} && git pull origin main 2>&1`,
  `cd ${TEMP} && git log --oneline -3`,
  `cp -v ${TEMP}/backend/src/controllers/authController.js ${NODEJS}/src/controllers/authController.js`,
  `cp -v ${TEMP}/backend/src/index.js ${NODEJS}/src/index.js`,
  `cp -v ${TEMP}/backend/src/controllers/approvalController.js ${NODEJS}/src/controllers/approvalController.js`,
  `cp -v ${TEMP}/backend/src/routes/approval.js ${NODEJS}/src/routes/approval.js`,
  `cp -v ${TEMP}/backend/src/services/approvalService.js ${NODEJS}/src/services/approvalService.js`,
  `cd ${TEMP}/frontend && ${NPM} install 2>&1 | tail -5`,
  `cd ${TEMP}/frontend && ${NPM} run build 2>&1 | tail -15`,
  `cd ${NODEJS} && ${NODE} scripts/sync-dist.js 2>&1`,
  `rm -rf ${PUBLIC}/assets`,
  `cp -rv ${TEMP}/frontend/dist/* ${PUBLIC}/`,
  `cd ${NODEJS} && cat .env | grep PORT`,
  `ps aux | grep "node.*index.js" | grep -v grep`,
  `cd ${NODEJS} && kill $(pgrep -f "node.*src/index.js") 2>/dev/null; sleep 2; nohup ${NODE} src/index.js > console.log 2>&1 & echo "Backend restarted with PID $!"`,
  `sleep 3 && ps aux | grep "node.*index.js" | grep -v grep`,
  `echo "=== DEPLOYMENT COMPLETE ==="`
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
  readyTimeout: 60000, keepaliveInterval: 10000
});
