const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const LOCAL_DIST = path.join(__dirname, 'frontend', 'dist');
const REMOTE_PUBLIC = '/home/u335953510/domains/pc.nkbmanufacturing.com/public_html';
const REMOTE_VERSION = '/home/u335953510/domains/pc.nkbmanufacturing.com/hbuilds/versions/01a0f9c5-e726-7192-ada2-ec2699b47a88/nodejs';
const REMOTE_NODEJS = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs';
const NODE = '/opt/alt/alt-nodejs20/root/bin/node';

conn.on('ready', () => {
  console.log('SSH Connected! Preparing directories...');
  
  const prepareCmd = `mkdir -p ${REMOTE_PUBLIC}/assets ${REMOTE_VERSION}/src/middleware ${REMOTE_VERSION}/src/routes ${REMOTE_VERSION}/src/controllers ${REMOTE_NODEJS}/src/middleware ${REMOTE_NODEJS}/src/routes ${REMOTE_NODEJS}/src/controllers ${REMOTE_NODEJS}/dist/assets ${REMOTE_VERSION}/dist/assets`;
  
  conn.exec(prepareCmd, (err, stream) => {
    stream.on('close', () => {
      conn.sftp((err, sftp) => {
        if (err) { console.error('SFTP error:', err.message); conn.end(); return; }
        
        const backendFiles = [
          {
            local: path.join(__dirname, 'backend', 'src', 'middleware', 'auth.js'),
            remotes: [`${REMOTE_VERSION}/src/middleware/auth.js`, `${REMOTE_NODEJS}/src/middleware/auth.js`]
          },
          {
            local: path.join(__dirname, 'backend', 'src', 'routes', 'settings.js'),
            remotes: [`${REMOTE_VERSION}/src/routes/settings.js`, `${REMOTE_NODEJS}/src/routes/settings.js`]
          },
          {
            local: path.join(__dirname, 'backend', 'src', 'routes', 'payables.js'),
            remotes: [`${REMOTE_VERSION}/src/routes/payables.js`, `${REMOTE_NODEJS}/src/routes/payables.js`]
          },
          {
            local: path.join(__dirname, 'backend', 'src', 'controllers', 'payableController.js'),
            remotes: [`${REMOTE_VERSION}/src/controllers/payableController.js`, `${REMOTE_NODEJS}/src/controllers/payableController.js`]
          }
        ];
        
        const distFiles = [];
        const assetsDir = path.join(LOCAL_DIST, 'assets');
        const rootFiles = fs.readdirSync(LOCAL_DIST).filter(f => !fs.statSync(path.join(LOCAL_DIST, f)).isDirectory());
        for (const f of rootFiles) {
          distFiles.push({ local: path.join(LOCAL_DIST, f), remote: `${REMOTE_PUBLIC}/${f}` });
        }
        for (const f of fs.readdirSync(assetsDir)) {
          distFiles.push({ local: path.join(assetsDir, f), remote: `${REMOTE_PUBLIC}/assets/${f}` });
        }
        
        console.log(`Uploading ${distFiles.length} frontend files and ${backendFiles.length} backend modules...`);
        
        // Step 1: Upload backend files sequentially
        const backendList = [];
        backendFiles.forEach(b => {
          b.remotes.forEach(r => backendList.push({ local: b.local, remote: r }));
        });
        
        let bIdx = 0;
        const uploadNextBackend = () => {
          if (bIdx >= backendList.length) {
            console.log('All backend files uploaded! Uploading frontend assets...');
            uploadFrontend();
            return;
          }
          const { local, remote } = backendList[bIdx++];
          sftp.fastPut(local, remote, (e) => {
            if (e) console.error(`Error uploading ${remote}:`, e.message);
            else console.log(`  Uploaded backend: ${remote}`);
            uploadNextBackend();
          });
        };
        
        uploadNextBackend();
        
        function uploadFrontend() {
          let fIdx = 0;
          const uploadNextFront = () => {
            if (fIdx >= distFiles.length) {
              console.log('All frontend assets uploaded! Finalizing server sync...');
              finalizeServer();
              return;
            }
            const { local, remote } = distFiles[fIdx++];
            sftp.fastPut(local, remote, (e) => {
              if (e) console.error(`Error uploading ${remote}:`, e.message);
              if (fIdx % 15 === 0) console.log(`  Uploaded ${fIdx}/${distFiles.length} frontend files...`);
              uploadNextFront();
            });
          };
          uploadNextFront();
        }
        
        function finalizeServer() {
          const restartCmds = [
            `cp -rf ${REMOTE_PUBLIC}/assets/* ${REMOTE_NODEJS}/dist/assets/ 2>/dev/null || true`,
            `cp -rf ${REMOTE_PUBLIC}/assets/* ${REMOTE_VERSION}/dist/assets/ 2>/dev/null || true`,
            `cp -f ${REMOTE_PUBLIC}/index.html ${REMOTE_NODEJS}/dist/index.html 2>/dev/null || true`,
            `cp -f ${REMOTE_PUBLIC}/index.html ${REMOTE_VERSION}/dist/index.html 2>/dev/null || true`,
            `mkdir -p ${REMOTE_NODEJS}/tmp && touch ${REMOTE_NODEJS}/tmp/restart.txt`,
            `mkdir -p ${REMOTE_VERSION}/tmp && touch ${REMOTE_VERSION}/tmp/restart.txt`,
            `mkdir -p ${REMOTE_PUBLIC}/tmp && touch ${REMOTE_PUBLIC}/tmp/restart.txt`,
            `pkill -f "pc.nkbmanufacturing.com" || true`,
            `pkill -f "node.*src/index.js" || true`,
            `sleep 2`,
            `cd ${REMOTE_NODEJS} && nohup ${NODE} src/index.js > console.log 2>&1 & echo "Backend restarted PID=$!"`,
            `sleep 2 && ps aux | grep "pc.nkbmanufacturing.com" | grep -v grep | head -2`
          ];
          
          let k = 0;
          const runCmd = () => {
            if (k >= restartCmds.length) {
              console.log('=== FULL DEPLOYMENT COMPLETE ===');
              conn.end();
              return;
            }
            const cmd = restartCmds[k++];
            console.log('>>>', cmd);
            conn.exec(cmd, (e, st) => {
              if (e) { console.error(e.message); runCmd(); return; }
              st.on('data', d => process.stdout.write(d.toString()))
                .on('stderr', d => process.stderr.write(d.toString()))
                .on('close', runCmd);
            });
          };
          runCmd();
        }
      });
    });
  });
}).on('error', err => {
  console.error('SSH Error:', err.message);
  process.exit(1);
}).connect({ host: '187.127.126.44', port: 65002, username: 'u335953510', password: 'NkbManufacturing@2026', readyTimeout: 60000 });
