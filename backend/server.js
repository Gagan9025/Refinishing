const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { seedDatabase } = require('./services/seedService');

const authRoutes = require('./routes/auth');
const scanningRoutes = require('./routes/scanning');
const batchRoutes = require('./routes/batch');
const attendanceRoutes = require('./routes/attendance');
const hodRoutes = require('./routes/hod');
const adminRoutes = require('./routes/admin');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/scanning', scanningRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/export', exportRoutes);

// Redirect old/removed dispatch routes directly to Attendance page
app.get(['/pages/dispatch-dashboard.html', '/dispatch-dashboard'], (req, res) => {
  res.redirect('/pages/attendance.html');
});

// Fallback to index.html for root and unhandled non-API page navigation
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found.' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

// Start server and seed database
app.listen(PORT, async () => {
  console.log(`================================================================`);
  console.log(` Refinishing Department Production Management System Server`);
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(`================================================================`);
  await seedDatabase();
});
