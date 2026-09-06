/* Common UI utilities, header clock, dynamic sidebar, mobile menu toggle, and working schedule logic */

const WORKING_SCHEDULE = [
  { slotId: 'slot_1', time: '8:30 AM – 9:30 AM', startHour: 8, startMin: 30, endHour: 9, endMin: 30, isLunch: false },
  { slotId: 'slot_2', time: '9:30 AM – 10:30 AM', startHour: 9, startMin: 30, endHour: 10, endMin: 30, isLunch: false },
  { slotId: 'slot_3', time: '10:30 AM – 11:30 AM', startHour: 10, startMin: 30, endHour: 11, endMin: 30, isLunch: false },
  { slotId: 'slot_4', time: '11:30 AM – 12:30 PM', startHour: 11, startMin: 30, endHour: 12, endMin: 30, isLunch: false },
  { slotId: 'slot_lunch', time: '12:30 PM – 1:00 PM (LUNCH)', startHour: 12, startMin: 30, endHour: 13, endMin: 0, isLunch: true },
  { slotId: 'slot_5', time: '1:00 PM – 2:00 PM', startHour: 13, startMin: 0, endHour: 14, endMin: 0, isLunch: false },
  { slotId: 'slot_6', time: '2:00 PM – 3:00 PM', startHour: 14, startMin: 0, endHour: 15, endMin: 0, isLunch: false },
  { slotId: 'slot_7', time: '3:00 PM – 4:00 PM', startHour: 15, startMin: 0, endHour: 16, endMin: 0, isLunch: false },
  { slotId: 'slot_8', time: '4:00 PM – 5:00 PM', startHour: 16, startMin: 0, endHour: 17, endMin: 0, isLunch: false }
];

function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function getSlotStatus(slot, targetDateStr) {
  const todayStr = new Date().toISOString().split('T')[0];

  if (targetDateStr < todayStr) return 'COMPLETED';
  if (targetDateStr > todayStr) return 'UPCOMING';

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const slotStartMinutes = slot.startHour * 60 + slot.startMin;
  const slotEndMinutes = slot.endHour * 60 + slot.endMin;

  if (slot.isLunch && currentMinutes >= slotStartMinutes && currentMinutes < slotEndMinutes) {
    return 'LUNCH BREAK';
  }

  if (currentMinutes >= slotStartMinutes && currentMinutes < slotEndMinutes) {
    return 'CURRENT HOUR';
  }

  if (currentMinutes >= slotEndMinutes) {
    return 'PASSED';
  }

  return 'UPCOMING';
}

function getDayStatusMessage(targetDateStr) {
  const todayStr = new Date().toISOString().split('T')[0];
  if (targetDateStr < todayStr) return 'HISTORICAL DATE';
  if (targetDateStr > todayStr) return 'UPCOMING DATE';

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (currentMinutes < (8 * 60 + 30)) return 'WORKING HOURS START AT 8:30 AM';
  if (currentMinutes >= (12 * 60 + 30) && currentMinutes < (13 * 60)) return 'LUNCH BREAK (12:30 PM – 1:00 PM)';
  if (currentMinutes >= (17 * 60)) return 'WORKING HOURS COMPLETED FOR TODAY';
  return 'PRODUCTION IN PROGRESS';
}

function initHeaderAndSidebar(activeKey = '') {
  const user = API.getUser();
  if (!user) return;

  const headerLeft = document.querySelector('.header-left');
  if (headerLeft && !document.getElementById('mobile-toggle-btn')) {
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'mobile-toggle-btn';
    toggleBtn.className = 'mobile-nav-toggle';
    toggleBtn.innerHTML = '☰ Menu';
    toggleBtn.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) sidebar.classList.toggle('mobile-open');
    });
    headerLeft.prepend(toggleBtn);
  }

  const userNameEl = document.getElementById('header-user-name');
  const userRoleEl = document.getElementById('header-user-role');
  const userAvatarEl = document.getElementById('header-user-avatar');
  const logoutBtn = document.getElementById('btn-logout');

  if (userNameEl) userNameEl.textContent = user.name || user.username;
  if (userRoleEl) userRoleEl.textContent = (user.role || '').replace('_', ' ').toUpperCase();
  if (userAvatarEl) userAvatarEl.textContent = (user.name || user.username).charAt(0).toUpperCase();

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => Auth.logout());
  }

  const dateEl = document.getElementById('header-date');
  const timeEl = document.getElementById('header-time');

  function updateClock() {
    const now = new Date();
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    if (timeEl) {
      timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  const sidebarNav = document.getElementById('sidebar-menu');
  if (!sidebarNav) return;

  const role = user.role;
  const menuItems = [];

  if (role === 'scanning_supervisor' || role === 'admin' || role === 'hod') {
    menuItems.push({ key: 'scanning-dashboard', label: 'Scanning Production', icon: '📦', url: '/pages/scanning-dashboard.html' });
    menuItems.push({ key: 'scanning-history', label: 'Scanning History', icon: '📜', url: '/pages/scanning-history.html' });
  }

  if (role === 'batch_supervisor' || role === 'admin' || role === 'hod') {
    menuItems.push({ key: 'batch-dashboard', label: 'Batch Production', icon: '⚙️', url: '/pages/batch-dashboard.html' });
    menuItems.push({ key: 'batch-history', label: 'Batch History', icon: '📜', url: '/pages/batch-history.html' });
  }

  if (role === 'dispatch_supervisor' || role === 'admin' || role === 'hod') {
    menuItems.push({ key: 'attendance', label: 'Employee Attendance', icon: '👥', url: '/pages/attendance.html' });
  }

  if (role === 'hod' || role === 'admin') {
    menuItems.push({ key: 'hod-dashboard', label: 'HOD Overview', icon: '📊', url: '/pages/hod-dashboard.html' });
  }

  if (role === 'admin') {
    menuItems.push({ key: 'admin-dashboard', label: 'System Admin', icon: '🛠️', url: '/pages/admin-dashboard.html' });
  }

  sidebarNav.innerHTML = menuItems.map(item => `
    <li>
      <a href="${item.url}" class="${activeKey === item.key ? 'active' : ''}">
        <span>${item.icon}</span>
        <span>${item.label}</span>
      </a>
    </li>
  `).join('');
}
