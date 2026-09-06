/* Authentication & RBAC Frontend Manager */

const Auth = {
  ROLE_DASHBOARDS: {
    scanning_supervisor: '/pages/scanning-dashboard.html',
    batch_supervisor: '/pages/batch-dashboard.html',
    dispatch_supervisor: '/pages/attendance.html',
    hod: '/pages/hod-dashboard.html',
    admin: '/pages/admin-dashboard.html'
  },

  async login(username, password) {
    const res = await API.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (res.token && res.user) {
      API.setToken(res.token);
      API.setUser(res.user);
      window.location.href = res.redirectUrl || this.ROLE_DASHBOARDS[res.user.role] || '/pages/unassigned.html';
    }
    return res;
  },

  logout() {
    API.clearAuth();
    window.location.href = '/index.html';
  },

  async checkAccess(allowedRoles = []) {
    const user = API.getUser();
    const token = API.getToken();

    if (!token || !user) {
      window.location.href = '/index.html?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }

    try {
      const res = await API.request('/api/auth/me');
      API.setUser(res.user);

      if (res.user.role === 'admin') {
        return true;
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(res.user.role)) {
        console.warn(`[RBAC] User role '${res.user.role}' not permitted for page ${window.location.pathname}.`);
        window.location.href = this.ROLE_DASHBOARDS[res.user.role] || '/index.html';
        return false;
      }

      return true;
    } catch (err) {
      console.error('[RBAC] Access check failed:', err);
      window.location.href = '/index.html?sessionExpired=true';
      return false;
    }
  }
};

window.Auth = Auth;

