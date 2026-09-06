const fs = require('fs');
const path = require('path');

const LOGO_PNG_PATH = path.join(__dirname, '../frontend/assets/logo.png');

if (!fs.existsSync(LOGO_PNG_PATH)) {
  console.error('PNG logo not found!');
  process.exit(1);
}

const logoBuffer = fs.readFileSync(LOGO_PNG_PATH);
const cleanBase64Logo = `data:image/png;base64,${logoBuffer.toString('base64')}`;

console.log('Clean PNG Base64 Logo generated! Length:', cleanBase64Logo.length);

// 1. Update style.css
const CSS_PATH = path.join(__dirname, '../frontend/css/style.css');
let cssContent = fs.readFileSync(CSS_PATH, 'utf-8');

// Replace any corrupted data:image or URL with cleanBase64Logo
cssContent = cssContent.replace(
  /background-image:\s*url\(['"]?data:image\/[^'"]+['"]?\)(,\s*url\(['"]?[^'"]+['"]?\))?;/g,
  `background-image: url('${cleanBase64Logo}');`
);

cssContent = cssContent.replace(
  /url\(['"]?data:image\/[^'"]+['"]?\)/g,
  `url('${cleanBase64Logo}')`
);

fs.writeFileSync(CSS_PATH, cssContent);
console.log('✅ Updated style.css with clean PNG Base64 logo!');

// 2. Update all HTML files
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
    
    // Replace any src with clean Base64 logo
    content = content.replace(/src="data:image\/[^"]+"/g, `src="${cleanBase64Logo}"`);
    content = content.replace(/src="[^"]*logo\.(png|jpg)[^"]*"/g, `src="${cleanBase64Logo}"`);

    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed logo in: ${path.basename(filePath)}`);
  }
});

console.log('🎉 All files updated with valid clean PNG Base64 logo!');
