const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmds = [
    'readlink -f /home/u335953510/domains/pc.nkbmanufacturing.com/hbuilds/current',
    'cat /home/u335953510/domains/pc.nkbmanufacturing.com/public_html/.htaccess | grep -v "^#"',
    'find /home/u335953510/domains/pc.nkbmanufacturing.com/ -name "auth.js"',
    'grep -n "x-api-key" /home/u335953510/domains/pc.nkbmanufacturing.com/nodejs/src/middleware/auth.js',
    'grep -n "x-api-key" /home/u335953510/domains/pc.nkbmanufacturing.com/hbuilds/current/src/middleware/auth.js'
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
}).connect({ host: '187.127.126.44', port: 65002, username: 'u335953510', password: 'NkbManufacturing@2026' });
