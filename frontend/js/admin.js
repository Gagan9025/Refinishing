/* System Admin Module JS */

let allUsers = [];

async function loadAdminDashboard() {
  try {
    const res = await API.request('/api/admin/users');
    allUsers = res.users || [];
    renderUsersTable();
  } catch (err) {
    showToast(err.message || 'Error loading users', 'error');
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('admin-users-table-body');
  if (!tbody) return;

  if (allUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No system users found.</td></tr>`;
    return;
  }

  const roleLabels = {
    scanning_supervisor: 'Scanning Supervisor',
    batch_supervisor: 'Batch Supervisor',
    dispatch_supervisor: 'Attendance Supervisor',
    hod: 'Department HOD',
    admin: 'System Admin'
  };

  tbody.innerHTML = allUsers.map(user => {
    const isActive = user.status === 'active';
    const isPrimaryAdmin = user.username === 'admin';

    return `
      <tr>
        <td><strong>${user.name}</strong></td>
        <td><code>${user.username}</code></td>
        <td><span class="badge badge-info">${roleLabels[user.role] || user.role}</span></td>
        <td>
          <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">
            ${isActive ? 'Active' : 'Disabled'}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'}" 
              onclick="toggleUserStatus('${user.username}', '${isActive ? 'disabled' : 'active'}')"
              ${isPrimaryAdmin ? 'disabled title="Cannot disable primary admin account"' : ''}>
              ${isActive ? 'Disable' : 'Enable'}
            </button>
            <button class="btn btn-sm btn-secondary" onclick="openResetPasswordModal('${user.username}', '${user.name}')">
              Reset Password
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function toggleUserStatus(username, newStatus) {
  try {
    await API.request(`/api/admin/users/${username}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });

    showToast(`User ${username} account ${newStatus}.`, 'success');
    loadAdminDashboard();
  } catch (err) {
    showToast(err.message || 'Failed to update user status', 'error');
  }
}

async function handleCreateUser(e) {
  e.preventDefault();
  const name = document.getElementById('create-user-name').value.trim();
  const username = document.getElementById('create-user-username').value.trim();
  const role = document.getElementById('create-user-role').value;
  const password = document.getElementById('create-user-password').value;

  if (!name || !username || !password || !role) {
    showToast('All fields are required.', 'warning');
    return;
  }

  try {
    await API.request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ name, username, role, password })
    });

    showToast(`User ${name} created successfully!`, 'success');
    closeCreateUserModal();
    loadAdminDashboard();
  } catch (err) {
    showToast(err.message || 'Failed to create user', 'error');
  }
}

let resetTargetUsername = null;

function openResetPasswordModal(username, name) {
  resetTargetUsername = username;
  document.getElementById('reset-user-display').textContent = `${name} (${username})`;
  document.getElementById('reset-password-modal').classList.add('active');
}

function closeResetPasswordModal() {
  resetTargetUsername = null;
  document.getElementById('reset-password-modal').classList.remove('active');
  document.getElementById('reset-password-form').reset();
}

async function handleResetPassword(e) {
  e.preventDefault();
  const newPassword = document.getElementById('reset-new-password').value;

  if (!newPassword || newPassword.length < 6) {
    showToast('Password must be at least 6 characters long', 'warning');
    return;
  }

  try {
    await API.request(`/api/admin/users/${resetTargetUsername}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });

    showToast('Password reset successfully.', 'success');
    closeResetPasswordModal();
  } catch (err) {
    showToast(err.message || 'Failed to reset password', 'error');
  }
}

function openCreateUserModal() {
  document.getElementById('create-user-modal').classList.add('active');
}

function closeCreateUserModal() {
  document.getElementById('create-user-modal').classList.remove('active');
  document.getElementById('create-user-form').reset();
}
