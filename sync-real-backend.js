const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const REMOTE_BASE = '/home/u335953510/domains/pc.nkbmanufacturing.com';
const CURRENT_VERSION = '/home/u335953510/domains/pc.nkbmanufacturing.com/hbuilds/versions/01a0f9c5-e726-7192-ada2-ec2699b47a88/nodejs';
const NODEJS = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs';

conn.on('ready', () => {
  console.log('SSH Connected! Uploading to actual active nodejs paths...');
  
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err.message);
      conn.end();
      return;
    }
    
    const targets = [
      {
        local: path.join(__dirname, 'backend', 'src', 'middleware', 'auth.js'),
        remotes: [
          `${CURRENT_VERSION}/src/middleware/auth.js`,
          `${NODEJS}/src/middleware/auth.js`
        ]
      },
      {
        local: path.join(__dirname, 'backend', 'src', 'routes', 'payables.js'),
        remotes: [
          `${CURRENT_VERSION}/src/routes/payables.js`,
          `${NODEJS}/src/routes/payables.js`
        ]
      },
      {
        local: path.join(__dirname, 'backend', 'src', 'controllers', 'payableController.js'),
        remotes: [
          `${CURRENT_VERSION}/src/controllers/payableController.js`,
          `${NODEJS}/src/controllers/payableController.js`
        ]
      },
      {
        local: path.join(__dirname, 'backend', 'src', 'routes', 'settings.js'),
        remotes: [
          `${CURRENT_VERSION}/src/routes/settings.js`,
          `${NODEJS}/src/routes/settings.js`
        ]
      }
    ];
    
    let pending = 0;
    targets.forEach(t => pending += t.remotes.length);
    
    targets.forEach(({ local, remotes }) => {
      remotes.forEach(remote => {
        const readStream = fs.createReadStream(local);
        const writeStream = sftp.createWriteStream(remote);
        writeStream.on('close', () => {
          pending--;
          console.log(`Synced: ${remote} (remaining: ${pending})`);
          if (pending === 0) {
            const restartCmds = [
              `mkdir -p ${CURRENT_VERSION}/tmp && touch ${CURRENT_VERSION}/tmp/restart.txt`,
              `mkdir -p ${NODEJS}/tmp && touch ${NODEJS}/tmp/restart.txt`,
              `mkdir -p ${REMOTE_BASE}/public_html/tmp && touch ${REMOTE_BASE}/public_html/tmp/restart.txt`,
              `pkill -f "pc.nkbmanufacturing.com" || true`,
              `sleep 2`,
              `ps aux | grep "pc.nkbmanufacturing.com" | grep -v grep | head -3`
            ];
            let k = 0;
            const run = () => {
              if (k >= restartCmds.length) {
                console.log('=== REAL BACKEND RESTART COMPLETE ===');
                conn.end();
                return;
              }
              const cmd = restartCmds[k++];
              console.log('>>>', cmd);
              conn.exec(cmd, (e, stream) => {
                if (e) { console.error(e.message); run(); return; }
                stream.on('data', d => process.stdout.write(d.toString()))
                      .on('stderr', d => process.stderr.write(d.toString()))
                      .on('close', run);
              });
            };
            run();
          }
        });
        readStream.pipe(writeStream);
      });
    });
  });
}).connect({ host: '187.127.126.44', port: 65002, username: 'u335953510', password: 'NkbManufacturing@2026' });
