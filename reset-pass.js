const { Client } = require('ssh2');
const c = new Client();
const N = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs';

const script = `
const bcrypt = require('bcryptjs');
const db = require('./src/config/db');
const newPass = 'NKB@2026';
const hash = bcrypt.hashSync(newPass, 10);
Promise.all([
  db('users').where({ username: 'admin' }).update({ password: hash }),
  db('users').where({ username: 'earl' }).update({ password: hash })
]).then(() => {
  console.log('SUCCESS: Passwords reset to NKB@2026 for admin and earl');
  return db('users').select('id','username','role','status');
}).then(r => {
  console.log(JSON.stringify(r, null, 2));
  process.exit();
}).catch(e => { console.error('ERROR:', e.message); process.exit(1); });
`;

c.on('ready', () => {
  console.log('SSH Connected! Resetting passwords...');
  c.exec(`cd ${N} && /opt/alt/alt-nodejs20/root/bin/node -e "${script.replace(/"/g, '\\"')}"`, (e, s) => {
    if (e) { console.error(e.message); process.exit(1); }
    s.on('data', d => process.stdout.write(d.toString()))
     .on('stderr', d => process.stderr.write(d.toString()))
     .on('close', (code) => { console.log(`[exit: ${code}]`); c.end(); });
  });
}).on('error', e => { console.error(e.message); process.exit(1); })
.connect({ host: '187.127.126.44', port: 65002, username: 'u335953510', password: 'NkbManufacturing@2026', readyTimeout: 30000 });