const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmds = [
    "mysql -u u335953510_ssh -pNkbManufacturing@2026 u335953510_pettycash_db -e \"SELECT username, role FROM users LIMIT 5;\" 2>&1",
    "ls /home/u335953510/domains/pc.nkbmanufacturing.com/public_html/assets/Expenses*",
    "ps aux | grep node | grep -v grep | head -5"
  ];
  let i = 0;
  const run = () => {
    if (i >= cmds.length) { conn.end(); return; }
    const cmd = cmds[i++];
    console.log('\n>>>', cmd);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error(err.message); run(); return; }
      stream.on('data', d => process.stdout.write(d.toString()))
            .on('stderr', d => process.stderr.write(d.toString()))
            .on('close', run);
    });
  };
  run();
}).connect({ host: '187.127.126.44', port: 65002, username: 'u335953510', password: 'NkbManufacturing@2026', readyTimeout: 30000 });
