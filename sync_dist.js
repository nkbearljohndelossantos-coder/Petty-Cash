const { Client } = require('ssh2');
const conn = new Client();
const NODEJS_DIST = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs/dist';
const PUBLIC = '/home/u335953510/domains/pc.nkbmanufacturing.com/public_html';

const cmds = [
  // Show current index.html in nodejs/dist to see what JS it references
  `cat ${NODEJS_DIST}/index.html`,
  // Show current index.html in public_html
  `cat ${PUBLIC}/index.html`,
  // List Expenses files in both locations
  `ls ${NODEJS_DIST}/assets/Expenses* 2>&1`,
  `ls ${PUBLIC}/assets/Expenses* 2>&1`,
  // Force sync public_html to nodejs/dist completely
  `rm -rf ${NODEJS_DIST}/* && cp -rv ${PUBLIC}/* ${NODEJS_DIST}/`,
  // Verify
  `cat ${NODEJS_DIST}/index.html`,
  `ls ${NODEJS_DIST}/assets/Expenses* 2>&1`,
  `echo "=== SYNC COMPLETE ==="`,
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
