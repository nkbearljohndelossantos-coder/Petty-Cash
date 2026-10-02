const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const LOCAL_DIST = path.join(__dirname, 'frontend', 'dist');
const REMOTE_BASE = '/home/u335953510/domains/pc.nkbmanufacturing.com';
const NODEJS = `${REMOTE_BASE}/nodejs`;
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

function connectSSH() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => resolve(conn));
    conn.on('error', reject);
    conn.connect({
      host: '187.127.126.44',
      port: 65002,
      username: 'u335953510',
      password: 'NkbManufacturing@2026',
      keepaliveInterval: 10000,
      readyTimeout: 40000
    });
  });
}

function execCmd(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let output = '';
      stream.on('data', d => {
        output += d.toString();
        process.stdout.write(d);
      });
      stream.stderr.on('data', d => {
        process.stderr.write(d);
      });
      stream.on('close', code => resolve({ code, output }));
    });
  });
}

(async () => {
  let conn;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[Attempt ${attempt}] Connecting SSH to Hostinger...`);
      conn = await connectSSH();
      console.log('SSH Connection Established!');
      break;
    } catch (err) {
      console.error(`Connection attempt ${attempt} failed:`, err.message);
      if (attempt === 3) process.exit(1);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  try {
    // 1. Discover all active build directories
    console.log('Step 1: Finding active version folders...');
    const { output: versionOutput } = await execCmd(conn, `ls -d ${REMOTE_BASE}/hbuilds/versions/*/nodejs ${REMOTE_BASE}/nodejs 2>/dev/null || true`);
    const targetDirs = versionOutput.trim().split('\n').filter(Boolean);
    console.log('Target directories for backend sync:', targetDirs);

    // 2. Ensure subdirectories
    for (const dir of targetDirs) {
      await execCmd(conn, `mkdir -p ${dir}/src/middleware ${dir}/src/routes ${dir}/src/controllers ${dir}/src/services ${dir}/tmp`);
    }
    await execCmd(conn, `mkdir -p ${REMOTE_PUBLIC}/assets ${REMOTE_NODEJS_DIST}/assets`);

    // 3. Open SFTP
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

    // 4. Upload Frontend Dist
    console.log('Step 2: Uploading frontend to public_html...');
    const rootFiles = fs.readdirSync(LOCAL_DIST).filter(f => !fs.statSync(path.join(LOCAL_DIST, f)).isDirectory());
    for (const f of rootFiles) {
      await sftpPut(path.join(LOCAL_DIST, f), `${REMOTE_PUBLIC}/${f}`);
    }

    const assetsDir = path.join(LOCAL_DIST, 'assets');
    for (const f of fs.readdirSync(assetsDir)) {
      await sftpPut(path.join(assetsDir, f), `${REMOTE_PUBLIC}/assets/${f}`);
    }
    console.log('Frontend uploaded to public_html!');

    // 5. Upload Backend files to every active path
    console.log('Step 3: Uploading backend files to all version folders...');
    for (const bf of backendFiles) {
      for (const dir of targetDirs) {
        const dest = `${dir}/${bf.remoteRel}`;
        console.log(`Syncing ${bf.remoteRel} -> ${dest}`);
        await sftpPut(bf.local, dest);
      }
    }

    // 6. Sync dist to nodejs/dist and restart
    console.log('Step 4: Syncing nodejs/dist and restarting server...');
    const postCmds = [
      `rm -rf ${REMOTE_NODEJS_DIST}/assets`,
      `cp -rv ${REMOTE_PUBLIC}/assets ${REMOTE_NODEJS_DIST}/assets`,
      `cp -v ${REMOTE_PUBLIC}/index.html ${REMOTE_NODEJS_DIST}/index.html`,
      `cp -v ${REMOTE_PUBLIC}/favicon.png ${REMOTE_NODEJS_DIST}/favicon.png 2>/dev/null || true`,
      `cp -v ${REMOTE_PUBLIC}/favicon.svg ${REMOTE_NODEJS_DIST}/favicon.svg 2>/dev/null || true`,
      `cp -v ${REMOTE_PUBLIC}/icons.svg ${REMOTE_NODEJS_DIST}/icons.svg 2>/dev/null || true`,
      `touch ${REMOTE_BASE}/hbuilds/current/nodejs/tmp/restart.txt 2>/dev/null || true`,
      `touch ${NODEJS}/tmp/restart.txt 2>/dev/null || true`,
      `touch ${REMOTE_PUBLIC}/tmp/restart.txt 2>/dev/null || true`,
      `pkill -f "pc.nkbmanufacturing.com" || true`,
      `sleep 2`,
      `cd ${NODEJS} && nohup ${NODE} src/index.js > console.log 2>&1 & echo "Spawned Node PID=$!"`,
      `sleep 2`,
      `ps aux | grep "pc.nkbmanufacturing.com" | grep -v grep | head -3`
    ].join(' && ');

    await execCmd(conn, postCmds);
    console.log('=== FULL DEPLOYMENT COMPLETE & VERIFIED ===');
  } catch (err) {
    console.error('Fatal Deployment error:', err);
  } finally {
    conn?.end();
  }
})();
