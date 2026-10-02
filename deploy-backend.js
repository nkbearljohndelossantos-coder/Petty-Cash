const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const REMOTE_NODEJS = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs';
const REMOTE_HBUILDS = '/home/u335953510/domains/pc.nkbmanufacturing.com/hbuilds/current';
const NODE = '/opt/alt/alt-nodejs20/root/bin/node';

conn.on('ready', () => {
  console.log('SSH Connected! Starting comprehensive backend sync...');
  
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err.message);
      conn.end();
      return;
    }
    
    const filesToUpload = [
      {
        local: path.join(__dirname, 'backend', 'src', 'middleware', 'auth.js'),
        remote: `${REMOTE_NODEJS}/src/middleware/auth.js`
      },
      {
        local: path.join(__dirname, 'backend', 'src', 'routes', 'payables.js'),
        remote: `${REMOTE_NODEJS}/src/routes/payables.js`
      },
      {
        local: path.join(__dirname, 'backend', 'src', 'controllers', 'payableController.js'),
        remote: `${REMOTE_NODEJS}/src/controllers/payableController.js`
      }
    ];
    
    let uploaded = 0;
    filesToUpload.forEach(({ local, remote }) => {
      const readStream = fs.createReadStream(local);
      const writeStream = sftp.createWriteStream(remote);
      
      writeStream.on('close', () => {
        uploaded++;
        console.log(`Uploaded (${uploaded}/${filesToUpload.length}): ${remote}`);
        if (uploaded === filesToUpload.length) {
          // Copy from nodejs to hbuilds/current and restart
          const syncCmds = [
            `cp -v ${REMOTE_NODEJS}/src/middleware/auth.js ${REMOTE_HBUILDS}/src/middleware/auth.js 2>/dev/null || true`,
            `cp -v ${REMOTE_NODEJS}/src/routes/payables.js ${REMOTE_HBUILDS}/src/routes/payables.js 2>/dev/null || true`,
            `cp -v ${REMOTE_NODEJS}/src/controllers/payableController.js ${REMOTE_HBUILDS}/src/controllers/payableController.js 2>/dev/null || true`,
            `mkdir -p ${REMOTE_NODEJS}/tmp && touch ${REMOTE_NODEJS}/tmp/restart.txt`,
            `mkdir -p ${REMOTE_HBUILDS}/tmp && touch ${REMOTE_HBUILDS}/tmp/restart.txt`,
            `pkill -f "pc.nkbmanufacturing.com" || true`,
            `pkill -f "node.*src/index.js" || true`,
            `sleep 2`,
            `cd ${REMOTE_NODEJS} && nohup ${NODE} src/index.js > console.log 2>&1 & echo "Backend restarted PID=$!"`,
            `sleep 2 && ps aux | grep "pc.nkbmanufacturing.com" | grep -v grep | head -3`
          ];
          
          let k = 0;
          const runCmd = () => {
            if (k >= syncCmds.length) {
              console.log('=== BACKEND DEPLOYMENT & RESTART COMPLETE ===');
              conn.end();
              return;
            }
            const cmd = syncCmds[k++];
            console.log(`>>> ${cmd}`);
            conn.exec(cmd, (err, stream) => {
              if (err) { console.error('Error:', err.message); runCmd(); return; }
              stream.on('data', d => process.stdout.write(d.toString()))
                    .on('stderr', d => process.stderr.write(d.toString()))
                    .on('close', () => runCmd());
            });
          };
          runCmd();
        }
      });
      
      readStream.pipe(writeStream);
    });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
  process.exit(1);
}).connect({
  host: '187.127.126.44', port: 65002,
  username: 'u335953510', password: 'NkbManufacturing@2026',
  readyTimeout: 60000, keepaliveInterval: 10000
});
