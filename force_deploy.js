const { Client } = require('ssh2');
const conn = new Client();

const TEMP = '/home/u335953510/domains/pc.nkbmanufacturing.com/temp_deploy';
const PUBLIC = '/home/u335953510/domains/pc.nkbmanufacturing.com/public_html';
const NODEJS_DIST = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs/dist';

const cmds = [
  // Wipe old assets completely
  `rm -rf ${PUBLIC}/assets && mkdir -p ${PUBLIC}/assets`,
  `rm -rf ${NODEJS_DIST}/assets && mkdir -p ${NODEJS_DIST}/assets`,
  // Copy all dist files fresh
  `cp -rv ${TEMP}/frontend/dist/assets/* ${PUBLIC}/assets/`,
  `cp -v ${TEMP}/frontend/dist/index.html ${PUBLIC}/index.html`,
  `cp -v ${TEMP}/frontend/dist/favicon.png ${PUBLIC}/favicon.png 2>/dev/null || true`,
  `cp -v ${TEMP}/frontend/dist/favicon.svg ${PUBLIC}/favicon.svg 2>/dev/null || true`,
  `cp -v ${TEMP}/frontend/dist/icons.svg ${PUBLIC}/icons.svg 2>/dev/null || true`,
  `cp -v ${TEMP}/frontend/dist/receiver.html ${PUBLIC}/receiver.html 2>/dev/null || true`,
  `cp -v ${TEMP}/frontend/dist/sender.html ${PUBLIC}/sender.html 2>/dev/null || true`,
  // Sync to nodejs/dist too
  `cp -rv ${PUBLIC}/assets/* ${NODEJS_DIST}/assets/`,
  `cp -v ${PUBLIC}/index.html ${NODEJS_DIST}/index.html`,
  // Verify Expenses file is there
  `ls ${PUBLIC}/assets/Expenses*`,
  `echo "=== FORCE DEPLOY COMPLETE ==="`,
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
