const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('ls -la /home/u335953510/domains/pc.nkbmanufacturing.com/; ls -la /home/u335953510/domains/pc.nkbmanufacturing.com/hbuilds/ 2>/dev/null; ps aux | grep node | grep -v grep', (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '187.127.126.44', port: 65002, username: 'u335953510', password: 'NkbManufacturing@2026' });
