/* API Service Wrapper for Refinishing Production Management System */

const API = {
  getToken() {
    return localStorage.getItem('refinishing_token');
  },

  setToken(token) {
    localStorage.setItem('refinishing_token', token);
  },

  clearAuth() {
    localStorage.removeItem('refinishing_token');
    localStorage.removeItem('refinishing_user');
  },

  getUser() {
    const raw = localStorage.getItem('refinishing_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem('refinishing_user', JSON.stringify(user));
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(endpoint, config);

      if (response.status === 401 || response.status === 403) {
        // Unauthenticated or expired session
        const data = await response.json().catch(() => ({}));
        if (response.status === 401 && !window.location.pathname.endsWith('index.html')) {
          this.clearAuth();
          window.location.href = '/index.html?sessionExpired=true';
        }
        throw new Error(data.error || 'Access Denied');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  }
};

window.API = API;

