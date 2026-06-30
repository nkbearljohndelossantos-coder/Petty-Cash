const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const sftpConn = new Client();

const LOCAL_DIST = 'e:\\Petty cash\\frontend\\dist';
const REMOTE_PUBLIC = '/home/u335953510/domains/pc.nkbmanufacturing.com/public_html';
const REMOTE_NODEJS_DIST = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs/dist';
const NODE = '/opt/alt/alt-nodejs20/root/bin/node';

conn.on('ready', () => {
  console.log('SSH Connected!');
  
  // Step 1: Remove old assets and copy new dist to public_html
  const cleanupCmds = [
    `rm -rf ${REMOTE_PUBLIC}/assets`,
    `rm -rf ${REMOTE_NODEJS_DIST}/assets`,
  ];
  
  let i = 0;
  const runCleanup = () => {
    if (i >= cleanupCmds.length) {
      // Now use SFTP to upload
      conn.sftp((err, sftp) => {
        if (err) { console.error('SFTP error:', err.message); conn.end(); return; }
        console.log('SFTP Connected! Uploading dist files...');
        
        const filesToUpload = [];
        const assetsDir = path.join(LOCAL_DIST, 'assets');
        const rootFiles = fs.readdirSync(LOCAL_DIST).filter(f => !fs.statSync(path.join(LOCAL_DIST, f)).isDirectory());
        
        // Collect all files
        for (const f of rootFiles) {
          filesToUpload.push({ local: path.join(LOCAL_DIST, f), remote: `${REMOTE_PUBLIC}/${f}` });
        }
        for (const f of fs.readdirSync(assetsDir)) {
          filesToUpload.push({ local: path.join(assetsDir, f), remote: `${REMOTE_PUBLIC}/assets/${f}` });
        }
        
        console.log(`Uploading ${filesToUpload.length} files...`);
        
        let j = 0;
        const uploadNext = () => {
          if (j >= filesToUpload.length) {
            console.log('All files uploaded to public_html!');
            
            // Also sync to nodejs/dist
            const syncCmd = `${NODE} ${REMOTE_NODEJS_DIST.replace('/dist', '')}/scripts/sync-dist.js`;
            // Actually just copy the same files
            const syncCmds = [
              `rm -rf ${REMOTE_NODEJS_DIST}/assets`,
              `cp -rv ${REMOTE_PUBLIC}/assets ${REMOTE_NODEJS_DIST}/assets`,
              `cp -v ${REMOTE_PUBLIC}/index.html ${REMOTE_NODEJS_DIST}/index.html`,
              `cp -v ${REMOTE_PUBLIC}/favicon.png ${REMOTE_NODEJS_DIST}/favicon.png 2>/dev/null`,
              `cp -v ${REMOTE_PUBLIC}/favicon.svg ${REMOTE_NODEJS_DIST}/favicon.svg 2>/dev/null`,
              `cp -v ${REMOTE_PUBLIC}/icons.svg ${REMOTE_NODEJS_DIST}/icons.svg 2>/dev/null`,
              `cp -v ${REMOTE_PUBLIC}/USER_MANUAL.md ${REMOTE_NODEJS_DIST}/USER_MANUAL.md 2>/dev/null`,
              // Restart backend
              `cd ${REMOTE_NODEJS_DIST.replace('/dist', '')} && nohup ${NODE} src/index.js > console.log 2>&1 & echo "Backend restarted PID=$!"`,
              `sleep 3 && ps aux | grep "node.*index.js" | grep -v grep | head -2`,
              `echo "=== FULL DEPLOYMENT COMPLETE ==="`
            ];
            let k = 0;
            const runSync = () => {
              if (k >= syncCmds.length) { conn.end(); return; }
              const cmd = syncCmds[k++];
              console.log(`>>> ${cmd}`);
              conn.exec(cmd, (err, stream) => {
                if (err) { console.error('Error:', err.message); runSync(); return; }
                stream.on('data', (d) => process.stdout.write(d.toString()))
                      .on('stderr', (d) => process.stderr.write(d.toString()))
                      .on('close', () => runSync());
              });
            };
            runSync();
            return;
          }
          
          const { local, remote } = filesToUpload[j];
          const remoteDir = path.dirname(remote);
          
          // Ensure directory exists then upload
          conn.exec(`mkdir -p ${remoteDir}`, (err, stream) => {
            const readStream = fs.createReadStream(local);
            const writeStream = sftp.createWriteStream(remote);
            
            writeStream.on('close', () => {
              j++;
              if (j % 10 === 0) console.log(`  Uploaded ${j}/${filesToUpload.length} files...`);
              uploadNext();
            }).on('error', (err) => {
              console.error(`Upload failed: ${remote}`, err.message);
              j++;
              uploadNext();
            });
            
            readStream.pipe(writeStream);
          });
        };
        
        uploadNext();
      });
      return;
    }
    
    const cmd = cleanupCmds[i++];
    console.log(`>>> ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error('Error:', err.message); runCleanup(); return; }
      stream.on('data', (d) => process.stdout.write(d.toString()))
            .on('stderr', (d) => process.stderr.write(d.toString()))
            .on('close', () => runCleanup());
    });
  };
  runCleanup();
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
  process.exit(1);
}).connect({
  host: '187.127.126.44', port: 65002,
  username: 'u335953510', password: 'NkbManufacturing@2026',
  readyTimeout: 60000, keepaliveInterval: 10000
});