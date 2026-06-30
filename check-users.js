const { Client } = require('ssh2');
const c = new Client();
const N = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs';

const cmds = [
  `cd ${N} && /opt/alt/alt-nodejs20/root/bin/node -e "
const db = require('./src/config/db');
db('users').select('id','username','role','status','full_name').then(r=>{
  console.log(JSON.stringify(r,null,2));
  process.exit();
}).catch(e=>{console.error(e.message);process.exit(1)});
"`,
];

let i = 0;
c.on('ready', () => {
  const next = () => {
    if (i >= cmds.length) { c.end(); return; }
    console.log(`\n>>> Querying users...`);
    c.exec(cmds[i++], (e, s) => {
      if (e) { console.error(e.message); next(); return; }
      s.on('data', d => process.stdout.write(d.toString()))
       .on('stderr', d => process.stderr.write(d.toString()))
       .on('close', (code) => { console.log(`[exit: ${code}]`); next(); });
    });
  };
  next();
}).on('error', e => { console.error(e.message); process.exit(1); })
.connect({ host: '187.127.126.44', port: 65002, username: 'u335953510', password: 'NkbManufacturing@2026', readyTimeout: 30000 });