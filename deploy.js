const { Client } = require('ssh2');
const conn = new Client();

const TEMP = '/home/u335953510/domains/pc.nkbmanufacturing.com/temp_deploy';
const NODEJS = '/home/u335953510/domains/pc.nkbmanufacturing.com/nodejs';
const PUBLIC = '/home/u335953510/domains/pc.nkbmanufacturing.com/public_html';
const NODE = '/opt/alt/alt-nodejs20/root/bin/node';
const NPM = '/opt/alt/alt-nodejs20/root/bin/npm';

const commands = [
  `cd ${TEMP} && git pull origin main 2>&1`,
  `cd ${TEMP} && git log --oneline -3`,
  `cp -v ${TEMP}/backend/src/controllers/authController.js ${NODEJS}/src/controllers/authController.js`,
  `cp -v ${TEMP}/backend/src/index.js ${NODEJS}/src/index.js`,
  `cp -v ${TEMP}/backend/src/controllers/approvalController.js ${NODEJS}/src/controllers/approvalController.js`,
  `cp -v ${TEMP}/backend/src/routes/approval.js ${NODEJS}/src/routes/approval.js`,
  `cp -v ${TEMP}/backend/src/services/approvalService.js ${NODEJS}/src/services/approvalService.js`,
  `cp -v ${TEMP}/backend/src/utils/approvalSchemaRepair.js ${NODEJS}/src/utils/approvalSchemaRepair.js`,
  `mkdir -p ${NODEJS}/src/utils/emailTemplates`,
  `cp -v ${TEMP}/backend/src/utils/emailTemplates/approvalReminder.js ${NODEJS}/src/utils/emailTemplates/approvalReminder.js`,
  `cp -v ${TEMP}/backend/src/db/migrations/20260618000001_update_approval_reminder_template.js ${NODEJS}/src/db/migrations/20260618000001_update_approval_reminder_template.js`,
  `cd ${TEMP}/frontend && ${NPM} install 2>&1 | tail -5`,
  `cd ${TEMP}/frontend && ${NPM} run build 2>&1 | tail -15`,
  `cd ${NODEJS} && ${NODE} scripts/sync-dist.js 2>&1`,
  `rm -rf ${PUBLIC}/assets`,
  `cp -rv ${TEMP}/frontend/dist/* ${PUBLIC}/`,
  // SAFE .htaccess merge: preserve Hostinger Passenger/LiteSpeed directives that survive server restarts.
  // Strategy: extract passenger lines from current file, overwrite with new, re-append passenger lines.
  `HTACCESS_NEW="${TEMP}/frontend/dist/.htaccess"; HTACCESS_DEST="${PUBLIC}/.htaccess"; PASSENGER_LINES=$(grep -E "^(Passenger|SetEnv|RewriteRule \\^\\\\.builds)" "$HTACCESS_DEST" 2>/dev/null || true); cp -v "$HTACCESS_NEW" "$HTACCESS_DEST"; if [ -n "$PASSENGER_LINES" ]; then echo "$PASSENGER_LINES" >> "$HTACCESS_DEST"; echo "Passenger config preserved."; else echo "WARN: No Passenger lines found in old .htaccess — Hostinger may need to re-inject them via hPanel."; fi`,
  `cd ${NODEJS} && cat .env | grep PORT`,
  // Trigger Phusion Passenger / LiteSpeed Node restart via tmp/restart.txt (correct method for Hostinger)
  `mkdir -p ${NODEJS}/tmp && touch ${NODEJS}/tmp/restart.txt && echo "Passenger/LiteSpeed Node restart triggered via restart.txt"`,
  `echo "=== DEPLOYMENT COMPLETE ==="`,
];

conn.on('ready', () => {
  console.log('SSH Connected!');
  let i = 0;
  const runNext = () => {
    if (i >= commands.length) { conn.end(); return; }
    const cmd = commands[i++];
    console.log(`\n>>> ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error('Error:', err.message); runNext(); return; }
      stream.on('data', (d) => process.stdout.write(d.toString()))
            .on('stderr', (d) => process.stderr.write(d.toString()))
            .on('close', (code) => { console.log(`[exit: ${code}]`); runNext(); });
    });
  };
  runNext();
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
  process.exit(1);
}).connect({
  host: '187.127.126.44', port: 65002,
  username: 'u335953510', password: 'NkbManufacturing@2026',
  readyTimeout: 60000, keepaliveInterval: 10000
});
