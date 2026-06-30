const { Client } = require('ssh2');
const c = new Client();
const N = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs';
const cmds = [
  `ps aux|grep 'node.*index.js'|grep -v grep|head -2`,
  `curl -s -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"test"}' 2>&1`,
  `head -20 ${N}/dist/index.html`,
  `cat /home/u335953510/domains/pc.nkbmanufacturing.com/public_html/.htaccess 2>/dev/null || echo NO_HTACCESS`,
  `cat ${N}/.env | grep -E 'FRONTEND|APP_URL|VITE'`,
  `ls -la ${N}/dist/assets/ | grep -i expenses`,
  `ls -la /home/u335953510/domains/pc.nkbmanufacturing.com/public_html/assets/ | grep -i expenses`,
  `tail -5 ${N}/console.log`,
];
let i = 0;
c.on('ready', () => {
  const next = () => {
    if (i >= cmds.length) { c.end(); return; }
    console.log(`\n>>> ${cmds[i]}`);
    c.exec(cmds[i++], (e, s) => {
      if (e) { console.error(e.message); next(); return; }
      s.on('data', d => process.stdout.write(d.toString()))
       .on('stderr', d => process.stderr.write(d.toString()))
       .on('close', () => next());
    });
  };
  next();
}).on('error', e => { console.error(e.message); process.exit(1); })
.connect({ host: '187.127.126.44', port: 65002, username: 'u335953510', password: 'NkbManufacturing@2026', readyTimeout: 30000 });