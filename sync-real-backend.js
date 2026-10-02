const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const REMOTE_BASE = '/home/u335953510/domains/pc.nkbmanufacturing.com';
const CURRENT_VERSION = '/home/u335953510/domains/pc.nkbmanufacturing.com/hbuilds/versions/01a0f9c5-e726-7192-ada2-ec2699b47a88/nodejs';
const NODEJS = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs';

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
  },
  {
    local: path.join(__dirname, 'backend', 'src', 'services', 'fmsService.js'),
    remotes: [
      `${CURRENT_VERSION}/src/services/fmsService.js`,
      `${NODEJS}/src/services/fmsService.js`
    ]
  }
];

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected! Creating directories...');
  const mkdirCmd = `mkdir -p ${CURRENT_VERSION}/src/middleware ${CURRENT_VERSION}/src/routes ${CURRENT_VERSION}/src/controllers ${CURRENT_VERSION}/src/services ${NODEJS}/src/middleware ${NODEJS}/src/routes ${NODEJS}/src/controllers ${NODEJS}/src/services`;
  
  conn.exec(mkdirCmd, (err, stream) => {
    if (err) {
      console.error('mkdir error:', err.message);
      conn.end();
      return;
    }
    
    stream.on('close', () => {
      console.log('Directories ensured. Opening SFTP...');
      conn.sftp((err, sftp) => {
        if (err) {
          console.error('SFTP error:', err.message);
          conn.end();
          return;
        }

        const uploadTasks = [];
        targets.forEach(t => {
          t.remotes.forEach(r => uploadTasks.push({ local: t.local, remote: r }));
        });

        const uploadNext = (index) => {
          if (index >= uploadTasks.length) {
            console.log('All backend files uploaded successfully! Triggering restart...');
            const restartCmds = [
              `mkdir -p ${CURRENT_VERSION}/tmp && touch ${CURRENT_VERSION}/tmp/restart.txt`,
              `mkdir -p ${NODEJS}/tmp && touch ${NODEJS}/tmp/restart.txt`,
              `mkdir -p ${REMOTE_BASE}/public_html/tmp && touch ${REMOTE_BASE}/public_html/tmp/restart.txt`,
              `pkill -f "pc.nkbmanufacturing.com" || true`,
              `sleep 2`,
              `ps aux | grep "pc.nkbmanufacturing.com" | grep -v grep | head -3`
            ].join(' && ');

            conn.exec(restartCmds, (err, rStream) => {
              if (err) console.error('Restart exec err:', err.message);
              rStream?.on('data', d => console.log('>>>', d.toString().trim()));
              rStream?.on('close', () => {
                console.log('=== REAL BACKEND RESTART COMPLETE ===');
                conn.end();
              });
            });
            return;
          }

          const task = uploadTasks[index];
          console.log(`[${index + 1}/${uploadTasks.length}] Uploading ${path.basename(task.local)} -> ${task.remote}`);
          
          sftp.fastPut(task.local, task.remote, (err) => {
            if (err) {
              console.error(`Error uploading to ${task.remote}:`, err.message);
              // Try stream fallback
              const readStream = fs.createReadStream(task.local);
              const writeStream = sftp.createWriteStream(task.remote);
              writeStream.on('close', () => {
                uploadNext(index + 1);
              });
              writeStream.on('error', (sErr) => {
                console.error(`Stream error for ${task.remote}:`, sErr.message);
                uploadNext(index + 1);
              });
              readStream.pipe(writeStream);
            } else {
              uploadNext(index + 1);
            }
          });
        };

        uploadNext(0);
      });
    });
  });
});

conn.on('error', (err) => {
  console.error('SSH Connection error:', err.message);
});

conn.connect({
  host: '187.127.126.44',
  port: 65002,
  username: 'u335953510',
  password: 'NkbManufacturing@2026',
  keepaliveInterval: 10000,
  readyTimeout: 30000
});
