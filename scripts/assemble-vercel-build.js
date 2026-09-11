const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const landing = path.join(root, 'frontend-dist');
const output = path.join(root, 'public-dist');

if (!fs.existsSync(path.join(landing, 'index.html'))) {
  throw new Error('Landing build is missing. Run the frontend build first.');
}
if (!fs.existsSync(path.join(output, 'app.html'))) {
  throw new Error('Workspace build is missing. Run the web build first.');
}

fs.copyFileSync(path.join(landing, 'index.html'), path.join(output, 'index.html'));
fs.cpSync(path.join(landing, 'landing-assets'), path.join(output, 'landing-assets'), {
  recursive: true,
  force: true,
});
fs.copyFileSync(path.join(landing, 'logo.svg'), path.join(output, 'logo.svg'));

console.log('Assembled landing page and workspace in public-dist.');
