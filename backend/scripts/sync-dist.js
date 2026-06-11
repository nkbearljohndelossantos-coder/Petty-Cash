/**
 * Clean-sync frontend/dist -> backend/dist for production deploy.
 * Prevents stale hashed assets causing MIME type errors (HTML served as JS).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../..');
const src = path.join(root, 'frontend/dist');
const dest = path.join(root, 'backend/dist');

function copyRecursive(from, to) {
  if (!fs.existsSync(from)) {
    console.error('Source not found:', from);
    process.exit(1);
  }
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}

copyRecursive(src, dest);

const htaccessTemplate = path.join(__dirname, 'htaccess.template');
if (fs.existsSync(htaccessTemplate)) {
  fs.copyFileSync(htaccessTemplate, path.join(dest, '.htaccess'));
}

console.log('Synced frontend/dist -> backend/dist (clean)');
