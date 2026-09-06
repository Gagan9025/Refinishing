const fs = require('fs');
const path = require('path');

const USER_BASE64_LOGO = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAJQAlgMBEQACEQEDEQH/xAAcAAACAgMBAQAAAAAAAAAAAAAABgQFAgMHAQj/xABOEAABAwMBAwULCQIKCwAAAAABAgMEAAURBhIhMQcTQVFhFBciVXF0gZGksdIjMjU2U3OhstFCUhUkM0NigpOzweEWJTdFVGNkcoOS8f/EABsBAAEFAQEAAAAAAAAAAAAAAAABAgMEBQYH/8QANREAAgEDAgIIBQQCAgMAAAAAAAECAwQREiEFMRMVQVFhcYGhIjIzUtEUNJGxI8ElQnLh8f/aAAw0BAObject: ...`;

// Extract binary image buffer and save to assets
const base64Data = USER_BASE64_LOGO.replace(/^data:image\/\w+;base64,/, '');
const imageBuffer = Buffer.from(base64Data, 'base64');

const LOGO_PNG_PATH = path.join(__dirname, '../frontend/assets/logo.png');
const LOGO_JPG_PATH = path.join(__dirname, '../frontend/assets/logo.jpg');

fs.writeFileSync(LOGO_PNG_PATH, imageBuffer);
fs.writeFileSync(LOGO_JPG_PATH, imageBuffer);
console.log('✅ Saved user base64 image to assets/logo.png & logo.jpg');

// 1. Update style.css
const CSS_PATH = path.join(__dirname, '../frontend/css/style.css');
let cssContent = fs.readFileSync(CSS_PATH, 'utf-8');

// Replace any background-image url Data URI or file path with the exact user base64
cssContent = cssContent.replace(
  /background-image:\s*url\(['"]?data:image\/[^'"]+['"]?\)(,\s*url\(['"]?[^'"]+['"]?\))?;/g,
  `background-image: url('${USER_BASE64_LOGO}');`
);

cssContent = cssContent.replace(
  /url\(['"]?data:image\/[^'"]+['"]?\)/g,
  `url('${USER_BASE64_LOGO}')`
);

fs.writeFileSync(CSS_PATH, cssContent);
console.log('✅ Updated style.css with exact user-provided Base64 logo!');

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
    content = content.replace(/src="data:image\/[^"]+"/g, `src="${USER_BASE64_LOGO}"`);
    content = content.replace(/src="[^"]*logo\.(png|jpg)[^"]*"/g, `src="${USER_BASE64_LOGO}"`);

    fs.writeFileSync(filePath, content);
    console.log(`✅ Embedded user logo into: ${path.basename(filePath)}`);
  }
});

console.log('All frontend HTML and CSS updated with user Base64 logo!');
