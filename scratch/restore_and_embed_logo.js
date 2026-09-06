const fs = require('fs');
const path = require('path');

const ORIGINAL_IMAGE = "C:\\Users\\ggaga\\.gemini\\antigravity-ide\\brain\\1cfeab87-75cf-409e-a32c-104ba1f96860\\media__1788714054668.png";
const TARGET_LOGO = path.join(__dirname, '../frontend/assets/logo.png');

if (!fs.existsSync(ORIGINAL_IMAGE)) {
  console.error('Original image not found!');
  process.exit(1);
}

// 1. Copy original clean 39KB image to assets/logo.png
fs.copyFileSync(ORIGINAL_IMAGE, TARGET_LOGO);
console.log('✅ Restored 39.6KB original logo to frontend/assets/logo.png');

// 2. Generate clean Base64 Data URI
const imageBuffer = fs.readFileSync(TARGET_LOGO);
const cleanBase64Logo = `data:image/png;base64,${imageBuffer.toString('base64')}`;

console.log('Valid Base64 string generated! Length:', cleanBase64Logo.length);

// 3. Update style.css
const CSS_PATH = path.join(__dirname, '../frontend/css/style.css');
let cssContent = fs.readFileSync(CSS_PATH, 'utf-8');

cssContent = cssContent.replace(
  /background-image:\s*url\(['"]?data:image\/[^'"]+['"]?\)(,\s*url\(['"]?[^'"]+['"]?\))?;/g,
  `background-image: url('${cleanBase64Logo}');`
);

cssContent = cssContent.replace(
  /url\(['"]?data:image\/[^'"]+['"]?\)/g,
  `url('${cleanBase64Logo}')`
);

fs.writeFileSync(CSS_PATH, cssContent);
console.log('✅ Updated style.css with valid 39KB Base64 logo!');

// 4. Update all HTML files
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
    
    content = content.replace(/src="data:image\/[^"]+"/g, `src="${cleanBase64Logo}"`);
    content = content.replace(/src="[^"]*logo\.(png|jpg)[^"]*"/g, `src="${cleanBase64Logo}"`);

    fs.writeFileSync(filePath, content);
    console.log(`✅ Embedded logo into: ${path.basename(filePath)}`);
  }
});

console.log('🎉 Logo fully restored and embedded across all pages!');
