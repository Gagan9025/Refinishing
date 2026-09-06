const fs = require('fs');
const path = require('path');

const LOGO_PATH = path.join(__dirname, '../frontend/assets/logo.png');
const logoBuffer = fs.readFileSync(LOGO_PATH);
const base64Logo = `data:image/png;base64,${logoBuffer.toString('base64')}`;

const htmlFiles = [
  path.join(__dirname, '../frontend/index.html'),
  path.join(__dirname, '../frontend/pages/scanning-dashboard.html'),
  path.join(__dirname, '../frontend/pages/scanning-history.html'),
  path.join(__dirname, '../frontend/pages/batch-dashboard.html'),
  path.join(__dirname, '../frontend/pages/batch-history.html'),
  path.join(__dirname, '../frontend/pages/attendance.html'),
  path.join(__dirname, '../frontend/pages/hod-dashboard.html'),
  path.join(__dirname, '../frontend/pages/admin-dashboard.html'),
  path.join(__dirname, '../frontend/pages/unassigned.html')
];

htmlFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace login logo src
    content = content.replace(/src="[^"]*logo\.png[^"]*"/g, `src="${base64Logo}"`);
    content = content.replace(/src='\.\.\/assets\/logo\.png'/g, `src="${base64Logo}"`);
    content = content.replace(/src='\/assets\/logo\.png'/g, `src="${base64Logo}"`);

    fs.writeFileSync(filePath, content);
    console.log(`✅ Embedded Base64 logo into: ${path.basename(filePath)}`);
  }
});

console.log('All HTML files updated with 100% self-contained embedded logo!');
