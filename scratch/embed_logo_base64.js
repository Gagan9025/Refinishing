const fs = require('fs');
const path = require('path');

const LOGO_PATH = path.join(__dirname, '../frontend/assets/logo.png');
const CSS_PATH = path.join(__dirname, '../frontend/css/style.css');

if (!fs.existsSync(LOGO_PATH)) {
  console.error('Logo file not found at:', LOGO_PATH);
  process.exit(1);
}

const logoBuffer = fs.readFileSync(LOGO_PATH);
const base64Logo = `data:image/png;base64,${logoBuffer.toString('base64')}`;

console.log('Base64 logo string generated. Length:', base64Logo.length);

// 1. Update style.css background watermark and login background to use Base64 Data URI
let cssContent = fs.readFileSync(CSS_PATH, 'utf-8');

cssContent = cssContent.replace(
  /background-image:\s*url\(['"]?\/assets\/logo\.png['"]?\),\s*url\(['"]?\.\.\/assets\/logo\.png['"]?\);/g,
  `background-image: url('${base64Logo}');`
);

cssContent = cssContent.replace(
  /background-image:\s*url\(['"]?\.\.\/assets\/logo\.png['"]?\);/g,
  `background-image: url('${base64Logo}');`
);

cssContent = cssContent.replace(
  /url\(['"]?\/assets\/logo\.png['"]?\)/g,
  `url('${base64Logo}')`
);

cssContent = cssContent.replace(
  /url\(['"]?\.\.\/assets\/logo\.png['"]?\)/g,
  `url('${base64Logo}')`
);

fs.writeFileSync(CSS_PATH, cssContent);
console.log('✅ Updated style.css with embedded Base64 logo.');

// 2. Also write a js helper asset file frontend/js/logo-data.js
const LOGO_JS_PATH = path.join(__dirname, '../frontend/js/logo-data.js');
const jsContent = `/* Self-contained embedded Base64 logo asset */\nwindow.ADITYA_BIRLA_LOGO = "${base64Logo}";\n`;
fs.writeFileSync(LOGO_JS_PATH, jsContent);
console.log('✅ Created frontend/js/logo-data.js with embedded Base64 logo.');
