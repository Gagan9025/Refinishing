const fs = require('fs');
const path = require('path');

const ORIGINAL_PNG = "C:\\Users\\ggaga\\.gemini\\antigravity-ide\\brain\\1cfeab87-75cf-409e-a32c-104ba1f96860\\media__1788714054668.png";
const TARGET_LOGO = path.join(__dirname, '../frontend/assets/logo.png');

if (fs.existsSync(ORIGINAL_PNG)) {
  fs.copyFileSync(ORIGINAL_PNG, TARGET_LOGO);
  console.log('✅ Restored 39.6 KB clean logo PNG to frontend/assets/logo.png');
}

const logoBuffer = fs.readFileSync(TARGET_LOGO);
const cleanBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

// 1. Update HTML files
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
    
    // Replace sidebar header content
    const cleanSidebarHeader = `<div class="sidebar-header">
        <img src="${cleanBase64}" alt="Aditya Birla Logo" class="sidebar-logo-img">
        <div class="sidebar-brand">
          Aditya Birla
          <span>Refinishing System</span>
        </div>
      </div>`;

    content = content.replace(/<div class="sidebar-header">[\s\S]*?<\/div>\s*<\/div>/g, cleanSidebarHeader);
    content = content.replace(/<img src="data:image\/[^"]+"/g, `src="${cleanBase64}"`);
    content = content.replace(/src="[^"]*logo\.(png|jpg)[^"]*"/g, `src="${cleanBase64}"`);

    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated HTML logo in: ${path.basename(filePath)}`);
  }
});

// 2. Update common.js
const COMMON_JS = path.join(__dirname, '../frontend/js/common.js');
let commonJsContent = fs.readFileSync(COMMON_JS, 'utf-8');
commonJsContent = commonJsContent.replace(
  /sidebarHeader\.innerHTML = [\s\S]*?`;/g,
  `sidebarHeader.innerHTML = \`
      <img src="\${window.ADITYA_BIRLA_LOGO || '${cleanBase64}'}" alt="Aditya Birla Logo" class="sidebar-logo-img">
      <div class="sidebar-brand">
        Aditya Birla
        <span>Refinishing System</span>
      </div>
    \`;`
);
fs.writeFileSync(COMMON_JS, commonJsContent);
console.log('✅ Updated common.js dynamic sidebar logo.');

// 3. Write Amber Glassmorphism CSS in style.css
const CSS_PATH = path.join(__dirname, '../frontend/css/style.css');

const amberGlassCss = `/* ==========================================================================
   Aditya Birla Refinishing System - Amber Glassmorphism Theme
   ========================================================================== */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

:root {
  /* Amber & Gold Palette */
  --color-primary: #f59e0b;
  --color-primary-hover: #d97706;
  --color-primary-light: rgba(245, 158, 11, 0.15);

  --color-dark-sidebar: rgba(15, 23, 42, 0.85);
  --color-dark-header: rgba(30, 41, 59, 0.85);
  --color-surface: rgba(15, 23, 42, 0.78);
  --color-bg: #0b0f19;
  --color-border: rgba(245, 158, 11, 0.22);
  
  /* Status Colors */
  --color-success: #10b981;
  --color-success-bg: rgba(16, 185, 129, 0.15);
  --color-success-border: rgba(16, 185, 129, 0.35);

  --color-warning: #f59e0b;
  --color-warning-bg: rgba(245, 158, 11, 0.15);
  --color-warning-border: rgba(245, 158, 11, 0.35);

  --color-danger: #ef4444;
  --color-danger-bg: rgba(239, 68, 68, 0.15);
  --color-danger-border: rgba(239, 68, 68, 0.35);

  --color-info: #06b6d4;
  --color-info-bg: rgba(6, 182, 212, 0.15);
  --color-info-border: rgba(6, 182, 212, 0.35);

  --color-lunch: #a855f7;
  --color-lunch-bg: rgba(168, 85, 247, 0.15);

  /* Typography */
  --font-main: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Elevation */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.35);
  --shadow-lg: 0 16px 32px rgba(0, 0, 0, 0.5);

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-main);
  background: radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.18) 0%, rgba(15, 23, 42, 0.98) 75%), #0b0f19;
  color: #f1f5f9;
  line-height: 1.5;
  min-height: 100vh;
  position: relative;
  -webkit-text-size-adjust: 100%;
}

/* Subtle low-visibility Aditya Birla watermark background on each and every page */
body::before {
  content: '';
  position: fixed;
  top: 50%;
  left: 55%;
  transform: translate(-50%, -50%);
  width: 550px;
  height: 550px;
  background-image: url('${cleanBase64}');
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  opacity: 0.08; /* Low visibility subtle watermark */
  pointer-events: none;
  z-index: 0;
}

/* App Layout */
.app-container {
  display: flex;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-right: 1px solid rgba(245, 158, 11, 0.22);
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(245, 158, 11, 0.2);
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-logo-icon, .sidebar-logo-img {
  width: 42px;
  height: 42px;
  object-fit: contain;
  background: #ffffff;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  flex-shrink: 0;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.3);
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.sidebar-brand {
  font-size: 1.05rem;
  font-weight: 800;
  color: #fbbf24;
  line-height: 1.2;
}

.sidebar-brand span {
  font-size: 0.75rem;
  color: #cbd5e1;
  display: block;
  font-weight: 500;
}

.sidebar-menu {
  list-style: none;
  padding: 16px 12px;
  flex-grow: 1;
}

.sidebar-menu li {
  margin-bottom: 6px;
}

.sidebar-menu a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #94a3b8;
  text-decoration: none;
  font-weight: 500;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.sidebar-menu a:hover {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
}

.sidebar-menu a.active {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.3) 100%);
  color: #fbbf24;
  font-weight: 700;
  border: 1px solid rgba(245, 158, 11, 0.4);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

.sidebar-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(245, 158, 11, 0.2);
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
}

/* Main Content Area */
.main-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Top Header */
.top-header {
  height: 64px;
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(245, 158, 11, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  box-shadow: var(--shadow-sm);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mobile-nav-toggle {
  display: none;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fbbf24;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.header-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #f8fafc;
}

.header-clock {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #f1f5f9;
}

.user-role {
  font-size: 0.725rem;
  color: #fbbf24;
}

/* Page Content */
.page-content {
  padding: 28px;
  flex-grow: 1;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #f8fafc;
}

.page-description {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-top: 4px;
}

/* Cards & Panels (Amber Glassmorphism) */
.panel, .metric-card {
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(245, 158, 11, 0.22);
  border-radius: var(--radius-md);
  padding: 24px;
  box-shadow: var(--shadow-md);
  margin-bottom: 24px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card {
  border-left: 4px solid #f59e0b;
}

.panel:hover, .metric-card:hover {
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 8px 32px rgba(245, 158, 11, 0.12);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.metric-title {
  font-size: 0.775rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 2rem;
  font-weight: 800;
  font-family: var(--font-mono);
  color: #fbbf24;
  line-height: 1.1;
}

.metric-sub {
  font-size: 0.775rem;
  color: #64748b;
  margin-top: 6px;
}

/* Forms & Inputs */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 0.825rem;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 6px;
}

.form-input, .form-select {
  width: 100%;
  padding: 10px 14px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-sm);
  color: #f8fafc;
  font-size: 0.925rem;
  font-family: var(--font-main);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(245, 158, 11, 0.5);
}

.btn-secondary {
  background: rgba(30, 41, 59, 0.8);
  color: #cbd5e1;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.btn-secondary:hover {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* Data Tables */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

.data-table th {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  padding: 12px 16px;
  text-align: left;
  font-size: 0.775rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid rgba(245, 158, 11, 0.3);
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(245, 158, 11, 0.12);
  font-size: 0.9rem;
  color: #e2e8f0;
}

.data-table tr:hover {
  background: rgba(245, 158, 11, 0.06);
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge-success { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
.badge-warning { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
.badge-danger { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
.badge-info { background: rgba(6, 182, 212, 0.2); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.4); }

/* Login Page Specific */
.login-body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  position: relative;
  background: radial-gradient(circle at 50% 30%, rgba(245, 158, 11, 0.22) 0%, rgba(15, 23, 42, 0.98) 75%), #0b0f19;
  padding: 20px;
}

.login-card {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  width: 100%;
  max-width: 450px;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(245, 158, 11, 0.35);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.15);
  padding: 40px 32px;
  position: relative;
  z-index: 2;
}

.login-brand-logo {
  text-align: center;
  margin-bottom: 16px;
}

.login-logo-img {
  height: 80px;
  width: auto;
  object-fit: contain;
  background: #ffffff;
  padding: 8px 18px;
  border-radius: var(--radius-md);
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.3);
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.login-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #f8fafc;
  margin-top: 12px;
  line-height: 1.3;
}

.login-subtitle {
  font-size: 0.875rem;
  color: #fbbf24;
  margin-top: 6px;
}

.demo-credentials-box {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-top: 24px;
}

.demo-credentials-title {
  font-weight: 700;
  color: #fbbf24;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.725rem;
}

.btn-demo-fill {
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-demo-fill:hover {
  border-color: #f59e0b;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.2);
}
`;

fs.writeFileSync(CSS_PATH, amberGlassCss);
console.log('🎉 Successfully applied Amber Glassmorphism Theme in style.css!');
