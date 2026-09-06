const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const dbService = require('../services/dbService');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const ALLOWED_ROLES = ['admin'];

// Get list of all users
router.get('/users', authenticateToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const rawUsers = await dbService.getCollection('users');
    const users = rawUsers.map(u => ({
      username: u.username,
      name: u.name,
      role: u.role,
      status: u.status || 'active',
      createdAt: u.createdAt
    }));
    res.json({ success: true, users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Unable to fetch users list.' });
  }
});

// Create new user
router.post('/users', authenticateToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ error: 'Username, password, name, and role are required.' });
    }

    const validRoles = ['scanning_supervisor', 'batch_supervisor', 'dispatch_supervisor', 'hod', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid user role specified.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await dbService.getDocument('users', cleanUsername);
    if (existing) {
      return res.status(400).json({ error: 'A user with this username already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      username: cleanUsername,
      name,
      role,
      status: 'active',
      passwordHash,
      createdBy: req.user.username,
      createdAt: new Date().toISOString()
    };

    await dbService.setDocument('users', cleanUsername, newUser);
    res.json({ success: true, message: 'User created successfully.', user: { username: cleanUsername, name, role, status: 'active' } });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Unable to create user.' });
  }
});

// Toggle user status (active / disabled) or role
router.put('/users/:username', authenticateToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const targetUsername = req.params.username.toLowerCase();
    const { role, status } = req.body;

    const user = await dbService.getDocument('users', targetUsername);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Prevent disabling the super admin account
    if (targetUsername === 'admin' && status === 'disabled') {
      return res.status(400).json({ error: 'Cannot disable the primary admin account.' });
    }

    const updatedUser = {
      ...user,
      role: role || user.role,
      status: status || user.status,
      updatedBy: req.user.username,
      updatedAt: new Date().toISOString()
    };

    await dbService.setDocument('users', targetUsername, updatedUser, true);
    res.json({ success: true, message: 'User updated successfully.' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Unable to update user.' });
  }
});

// Reset password for a user
router.post('/users/:username/reset-password', authenticateToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const targetUsername = req.params.username.toLowerCase();
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = await dbService.getDocument('users', targetUsername);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updatedUser = {
      ...user,
      passwordHash,
      updatedBy: req.user.username,
      updatedAt: new Date().toISOString()
    };

    await dbService.setDocument('users', targetUsername, updatedUser, true);
    res.json({ success: true, message: `Password for ${user.name} reset successfully.` });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ error: 'Unable to reset password.' });
  }
});

module.exports = router;
