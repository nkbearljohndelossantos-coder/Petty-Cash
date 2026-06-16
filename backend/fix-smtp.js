/**
 * Hostinger SMTP Fix Script
 * Run this ONCE on your Hostinger server to fix the .env SMTP settings.
 * 
 * Usage (paste in Hostinger terminal):
 *   node fix-smtp.js
 */
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '.env');

if (!fs.existsSync(ENV_PATH)) {
  console.error('❌ .env file not found at:', ENV_PATH);
  process.exit(1);
}

let content = fs.readFileSync(ENV_PATH, 'utf8');
let changed = false;

const fixes = [
  { key: 'SMTP_HOST',    old: /SMTP_HOST=.*/,    new: 'SMTP_HOST=smtp.hostinger.com' },
  { key: 'SMTP_PORT',    old: /SMTP_PORT=.*/,    new: 'SMTP_PORT=465' },
  { key: 'SMTP_USER',    old: /SMTP_USER=.*/,    new: 'SMTP_USER=customerservice@nkbmanufacturing.com' },
  { key: 'SMTP_PASS',    old: /SMTP_PASS=.*/,    new: 'SMTP_PASS=NkbManufacturing@2025' },
  { key: 'SMTP_SECURE',  old: /SMTP_SECURE=.*/,  new: 'SMTP_SECURE=true' },
  { key: 'EMAIL_FROM',   old: /EMAIL_FROM=.*/,   new: 'EMAIL_FROM="NKB Petty Cash" <customerservice@nkbmanufacturing.com>' }
];

for (const fix of fixes) {
  if (fix.old.test(content)) {
    const match = content.match(fix.old);
    if (match[0] !== fix.new) {
      console.log(`  ${fix.key}: "${match[0]}" → "${fix.new}"`);
      content = content.replace(fix.old, fix.new);
      changed = true;
    } else {
      console.log(`  ${fix.key}: already correct ✓`);
    }
  } else {
    console.log(`  ${fix.key}: not found, adding...`);
    content += `\n${fix.new}`;
    changed = true;
  }
}

if (changed) {
  fs.writeFileSync(ENV_PATH, content, 'utf8');
  console.log('\n✅ .env updated successfully!');
  console.log('🔄 Now restart the Node.js app from Hostinger hPanel.');
} else {
  console.log('\n✅ .env is already correct. No changes needed.');
}
