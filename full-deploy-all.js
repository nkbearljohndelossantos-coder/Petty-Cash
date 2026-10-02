const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const LOCAL_DIST = path.join(__dirname, 'frontend', 'dist');
const REMOTE_BASE = '/home/u335953510/domains/pc.nkbmanufacturing.com';
const CURRENT_VERSION = '/home/u335953510/domains/pc.nkbmanufacturing.com/hbuilds/versions/01a0f9c5-e726-7192-ada2-ec2699b47a88/nodejs';
const NODEJS = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs';
const REMOTE_PUBLIC = `${REMOTE_BASE}/public_html`;
const REMOTE_NODEJS_DIST = `${NODEJS}/dist`;
const NODE = '/opt/alt/alt-nodejs20/root/bin/node';

const backendFiles = [
  {
    local: path.join(__dirname, 'backend', 'src', 'middleware', 'auth.js'),
    remoteRel: 'src/middleware/auth.js'
  },
  {
    local: path.join(__dirname, 'backend', 'src', 'routes', 'payables.js'),
    remoteRel: 'src/routes/payables.js'
  },
  {
    local: path.join(__dirname, 'backend', 'src', 'controllers', 'payableController.js'),
    remoteRel: 'src/controllers/payableController.js'
  },
  {
    local: path.join(__dirname, 'backend', 'src', 'routes', 'settings.js'),
    remoteRel: 'src/routes/settings.js'
  },
  {
    local: path.join(__dirname, 'backend', 'src', 'services', 'fmsService.js'),
    remoteRel: 'src/services/fmsService.js'
  }
];

const conn = new Client();

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      let output = '';
      stream.on('data', d => {
        output += d.toString();
        process.stdout.write(d);
      });
      stream.stderr.on('data', d => {
        process.stderr.write(d);
      });
      stream.on('close', (code) => {
        resolve({ code, output });
      });
    });
  });
}

conn.on('ready', async () => {
  console.log('=== SSH CONNECTED ===');
  try {
    // 1. Prepare directories
    console.log('Step 1: Ensuring directories...');
    await executeCommand(`mkdir -p ${REMOTE_PUBLIC}/assets ${REMOTE_NODEJS_DIST}/assets ${CURRENT_VERSION}/src/middleware ${CURRENT_VERSION}/src/routes ${CURRENT_VERSION}/src/controllers ${CURRENT_VERSION}/src/services ${NODEJS}/src/middleware ${NODEJS}/src/routes ${NODEJS}/src/controllers ${NODEJS}/src/services`);

    // 2. Open SFTP
    console.log('Step 2: Uploading files via SFTP...');
    const sftp = await new Promise((resolve, reject) => {
      conn.sftp((err, sftpSession) => {
        if (err) reject(err);
        else resolve(sftpSession);
      });
    });

    const sftpPut = (local, remote) => {
      return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(local);
        const writeStream = sftp.createWriteStream(remote);
        writeStream.on('close', resolve);
        writeStream.on('error', reject);
        readStream.pipe(writeStream);
      });
    };

    // Upload Frontend Dist to public_html
    const rootFiles = fs.readdirSync(LOCAL_DIST).filter(f => !fs.statSync(path.join(LOCAL_DIST, f)).isDirectory());
    for (const f of rootFiles) {
      const localP = path.join(LOCAL_DIST, f);
      const remoteP = `${REMOTE_PUBLIC}/${f}`;
      console.log(`[Frontend] ${f} -> public_html`);
      await sftpPut(localP, remoteP);
    }

    const assetsDir = path.join(LOCAL_DIST, 'assets');
    const assetFiles = fs.readdirSync(assetsDir);
    for (const f of assetFiles) {
      const localP = path.join(assetsDir, f);
      const remoteP = `${REMOTE_PUBLIC}/assets/${f}`;
      console.log(`[Frontend Asset] ${f}`);
      await sftpPut(localP, remoteP);
    }

    // Upload Backend Files to both paths
    for (const bf of backendFiles) {
      console.log(`[Backend] Syncing ${bf.remoteRel}...`);
      await sftpPut(bf.local, `${CURRENT_VERSION}/${bf.remoteRel}`);
      await sftpPut(bf.local, `${NODEJS}/${bf.remoteRel}`);
    }

    console.log('Step 3: Syncing dist to nodejs/dist and restarting backend...');
    const postCmds = [
      `rm -rf ${REMOTE_NODEJS_DIST}/assets`,
      `cp -rv ${REMOTE_PUBLIC}/assets ${REMOTE_NODEJS_DIST}/assets`,
      `cp -v ${REMOTE_PUBLIC}/index.html ${REMOTE_NODEJS_DIST}/index.html`,
      `cp -v ${REMOTE_PUBLIC}/favicon.png ${REMOTE_NODEJS_DIST}/favicon.png 2>/dev/null || true`,
      `cp -v ${REMOTE_PUBLIC}/favicon.svg ${REMOTE_NODEJS_DIST}/favicon.svg 2>/dev/null || true`,
      `cp -v ${REMOTE_PUBLIC}/icons.svg ${REMOTE_NODEJS_DIST}/icons.svg 2>/dev/null || true`,
      `cp -v ${REMOTE_PUBLIC}/USER_MANUAL.md ${REMOTE_NODEJS_DIST}/USER_MANUAL.md 2>/dev/null || true`,
      `mkdir -p ${CURRENT_VERSION}/tmp && touch ${CURRENT_VERSION}/tmp/restart.txt`,
      `mkdir -p ${NODEJS}/tmp && touch ${NODEJS}/tmp/restart.txt`,
      `mkdir -p ${REMOTE_PUBLIC}/tmp && touch ${REMOTE_PUBLIC}/tmp/restart.txt`,
      `pkill -f "pc.nkbmanufacturing.com" || true`,
      `sleep 2`,
      `cd ${NODEJS} && nohup ${NODE} src/index.js > console.log 2>&1 & echo "Process Spawned PID=$!"`,
      `sleep 2`,
      `ps aux | grep "pc.nkbmanufacturing.com" | grep -v grep | head -3`
    ].join(' && ');

    await executeCommand(postCmds);
    console.log('=== FULL DEPLOYMENT & BACKEND SYNC SUCCESSFUL ===');
  } catch (err) {
    console.error('Deployment error:', err);
  } finally {
    conn.end();
  }
});

conn.on('error', (err) => {
  console.error('SSH Error:', err.message);
});

conn.connect({
  host: '187.127.126.44',
  port: 65002,
  username: 'u335953510',
  password: 'NkbManufacturing@2026'
});
