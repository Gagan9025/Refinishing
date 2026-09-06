const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbService = require('../services/dbService');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Role dashboard redirection path mapping
const ROLE_DASHBOARDS = {
  scanning_supervisor: '/pages/scanning-dashboard.html',
  batch_supervisor: '/pages/batch-dashboard.html',
  dispatch_supervisor: '/pages/attendance.html',
  hod: '/pages/hod-dashboard.html',
  admin: '/pages/admin-dashboard.html'
};

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await dbService.getDocument('users', cleanUsername);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Account disabled. Please contact system administrator.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const payload = {
      username: user.username,
      name: user.name,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        username: user.username,
        name: user.name,
        role: user.role
      },
      redirectUrl: ROLE_DASHBOARDS[user.role] || '/pages/unassigned.html'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An unexpected server error occurred during login.' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbService.getDocument('users', req.user.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({
      user: {
        username: user.username,
        name: user.name,
        role: user.role,
        status: user.status
      },
      redirectUrl: ROLE_DASHBOARDS[user.role] || '/pages/unassigned.html'
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching user profile.' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
