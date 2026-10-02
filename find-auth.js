const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmds = [
    'find /home/u335953510/domains/pc.nkbmanufacturing.com/ -name "auth.js" 2>/dev/null',
    'readlink -f /home/u335953510/domains/pc.nkbmanufacturing.com/hbuilds/current'
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
}).on('error', err => {
  console.error('SSH Error:', err.message);
}).connect({ host: '187.127.126.44', port: 65002, username: 'u335953510', password: 'NkbManufacturing@2026', readyTimeout: 60000 });
