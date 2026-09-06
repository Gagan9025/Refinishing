const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '../frontend/assets/logo.png');
const logoBuffer = fs.readFileSync(logoPath);
const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

// 1. Generate Clean Official White Corporate CSS
const whiteCorporateCSS = `/* ==========================================================================
   Aditya Birla Refinishing System - Official White Corporate Theme
   ========================================================================== */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

:root {
  /* Aditya Birla Official Color Palette */
  --color-primary: #1d4ed8;
  --color-primary-hover: #1e40af;
  --color-primary-light: #eff6ff;
  
  --color-brand-maroon: #9e1b1e;
  --color-brand-navy: #0f172a;

  --color-dark-sidebar: #0f172a;
  --color-dark-header: #1e293b;
  --color-surface: #ffffff;
  --color-bg: #f8fafc;
  --color-border: #e2e8f0;
  
  /* Text Colors */
  --color-text-main: #0f172a;
  --color-text-muted: #64748b;
  --color-text-light: #94a3b8;

  /* Status Colors */
  --color-success: #16a34a;
  --color-success-bg: #f0fdf4;
  --color-success-border: #bbf7d0;

  --color-warning: #d97706;
  --color-warning-bg: #fffbeb;
  --color-warning-border: #fef3c7;

  --color-danger: #dc2626;
  --color-danger-bg: #fef2f2;
  --color-danger-border: #fecaca;

  --color-info: #0284c7;
  --color-info-bg: #f0f9ff;
  --color-info-border: #bae6fd;

  --color-lunch: #9333ea;
  --color-lunch-bg: #faf5ff;

  /* Typography */
  --font-main: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Elevation */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.03);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.08);

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-main);
  background-color: var(--color-bg);
  background-image: radial-gradient(at 0% 0%, #ffffff 0px, transparent 50%), radial-gradient(at 100% 100%, #f1f5f9 0px, transparent 50%);
  color: var(--color-text-main);
  line-height: 1.5;
  min-height: 100vh;
  position: relative;
  -webkit-text-size-adjust: 100%;
}

/* Official Aditya Birla Watermark Background on Light Page */
body::before {
  content: '';
  position: fixed;
  top: 52%;
  left: 55%;
  transform: translate(-50%, -50%);
  width: 500px;
  height: 500px;
  background-image: url('${logoBase64}');
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  opacity: 0.05;
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
  background: var(--color-dark-sidebar);
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 100;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.sidebar-header {
  padding: 20px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.95);
}

.sidebar-logo-img {
  width: 42px;
  height: 42px;
  object-fit: contain;
  border-radius: 6px;
  background: #ffffff;
  padding: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.brand-text h1 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.brand-text span {
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-top: 2px;
}

.sidebar-nav {
  padding: 16px 12px;
  flex: 1;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.nav-item.active {
  background: var(--color-primary);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(29, 78, 216, 0.3);
}

.nav-item svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
}

/* Main Content Area */
.main-content {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: transparent;
  position: relative;
  z-index: 1;
}

/* Header */
.top-header {
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  position: sticky;
  top: 0;
  z-index: 90;
  box-shadow: var(--shadow-sm);
}

.header-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text-main);
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-time-pill {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-main);
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 14px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: var(--color-brand-maroon);
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-main);
}

.user-role {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  font-weight: 600;
}

.btn-logout {
  background: #ffffff;
  border: 1px solid var(--color-border);
  color: var(--color-text-main);
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border-color: var(--color-danger-border);
}

/* Dashboard Body */
.page-body {
  padding: 28px;
  flex: 1;
}

.page-header-block {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.page-header-block h2 {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--color-text-main);
  letter-spacing: -0.02em;
}

.page-header-block p {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-top: 4px;
}

.action-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

/* Card Components */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
}

/* Metric KPI Cards Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.kpi-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  border-top: 4px solid var(--color-primary);
}

.kpi-card.success { border-top-color: var(--color-success); }
.kpi-card.warning { border-top-color: var(--color-warning); }
.kpi-card.danger { border-top-color: var(--color-danger); }
.kpi-card.info { border-top-color: var(--color-info); }

.kpi-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
}

.kpi-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-text-main);
  margin: 8px 0 4px 0;
  letter-spacing: -0.02em;
}

.kpi-subtitle {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

/* Tables */
.table-responsive {
  width: 100%;
  overflow-x: auto;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: #ffffff;
  box-shadow: var(--shadow-sm);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;
}

.data-table th {
  background: #f1f5f9;
  color: var(--color-text-main);
  font-weight: 700;
  padding: 14px 18px;
  border-bottom: 2px solid var(--color-border);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.data-table td {
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-main);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover {
  background: #f8fafc;
}

/* Forms & Inputs */
.form-group {
  margin-bottom: 18px;
}

.form-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-main);
  margin-bottom: 6px;
}

.form-input, .form-select {
  width: 100%;
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-sm);
  color: var(--color-text-main);
  font-size: 0.9rem;
  font-family: inherit;
  transition: all 0.2s ease;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.15);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn-primary {
  background: var(--color-primary);
  color: #ffffff;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px rgba(29, 78, 216, 0.25);
}

.btn-secondary {
  background: #ffffff;
  border-color: var(--color-border);
  color: var(--color-text-main);
}

.btn-secondary:hover {
  background: #f1f5f9;
}

.btn-danger {
  background: var(--color-danger);
  color: #ffffff;
}

.btn-danger:hover {
  background: #b91c1c;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
}

.btn-success {
  background: var(--color-success);
  color: #ffffff;
}

.btn-success:hover {
  background: #15803d;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.8rem;
}

/* Status Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge-success { background: var(--color-success-bg); color: var(--color-success); border: 1px solid var(--color-success-border); }
.badge-warning { background: var(--color-warning-bg); color: var(--color-warning); border: 1px solid var(--color-warning-border); }
.badge-danger { background: var(--color-danger-bg); color: var(--color-danger); border: 1px solid var(--color-danger-border); }
.badge-info { background: var(--color-info-bg); color: var(--color-info); border: 1px solid var(--color-info-border); }
.badge-lunch { background: var(--color-lunch-bg); color: var(--color-lunch); border: 1px solid #e9d5ff; }

/* Login Page Specific Styling */
.login-body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 36px;
  box-shadow: var(--shadow-lg);
  position: relative;
  z-index: 10;
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-logo-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 16px;
  border-radius: 12px;
  box-shadow: var(--shadow-md);
}

.login-header h1 {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.login-header p {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  margin-top: 4px;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.active {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
  }

  .top-header {
    padding: 0 16px;
  }

  .page-body {
    padding: 16px;
  }
}
`;

// Save style.css
fs.writeFileSync(path.join(__dirname, '../frontend/css/style.css'), whiteCorporateCSS, 'utf8');
console.log('✅ Applied Official White Corporate Theme to style.css!');

// 2. Update common.js dynamic sidebar
const commonJsPath = path.join(__dirname, '../frontend/js/common.js');
let commonJs = fs.readFileSync(commonJsPath, 'utf8');

const sidebarHeaderReplacement = `<div class="sidebar-header">
    <img src="${logoBase64}" alt="Aditya Birla Logo" class="sidebar-logo-img" />
    <div class="brand-text">
        <h1>Aditya Birla</h1>
        <span>Refinishing System</span>
    </div>
</div>`;

commonJs = commonJs.replace(/<div class="sidebar-header">[\s\S]*?<\/div>\s*<\/div>/, sidebarHeaderReplacement);
fs.writeFileSync(commonJsPath, commonJs, 'utf8');
console.log('✅ Updated common.js dynamic sidebar logo.');

// 3. Update all HTML files with inline clean Base64 data logo string
const htmlFiles = [
  'frontend/index.html',
  'frontend/pages/scanning-dashboard.html',
  'frontend/pages/scanning-history.html',
  'frontend/pages/batch-dashboard.html',
  'frontend/pages/batch-history.html',
  'frontend/pages/attendance.html',
  'frontend/pages/hod-dashboard.html',
  'frontend/pages/admin-dashboard.html',
  'frontend/pages/unassigned.html'
];

htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace sidebar header logo
    content = content.replace(
      /<div class="sidebar-header">[\s\S]*?<\/div>\s*<\/div>/,
      `<div class="sidebar-header">
    <img src="${logoBase64}" alt="Aditya Birla Logo" class="sidebar-logo-img" />
    <div class="brand-text">
        <h1>Aditya Birla</h1>
        <span>Refinishing System</span>
    </div>
</div>`
    );

    // Replace login logo if present
    content = content.replace(
      /<img[^>]*class="login-logo-img"[^>]*>/,
      `<img src="${logoBase64}" alt="Aditya Birla Logo" class="login-logo-img" />`
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated HTML logo in: ${path.basename(file)}`);
  }
});

console.log('🎉 Successfully applied Official White Corporate Theme & Aditya Birla Logo across the system!');
