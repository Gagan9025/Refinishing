const express = require('express');
const router = express.Router();
const exportService = require('../services/exportService');
const { authenticateToken } = require('../middleware/auth');

// Export CSV / Excel endpoint
router.get('/download', authenticateToken, async (req, res) => {
  try {
    const { module: mod, startDate, endDate, format } = req.query;
    const userRole = req.user.role;

    const moduleName = mod || 'scanning';

    // Verify role permissions for exports
    if (userRole === 'scanning_supervisor' && moduleName !== 'scanning') {
      return res.status(403).json({ error: 'Access denied. You can only export Scanning records.' });
    }
    if (userRole === 'batch_supervisor' && moduleName !== 'batch') {
      return res.status(403).json({ error: 'Access denied. You can only export Batch records.' });
    }
    if (userRole === 'dispatch_supervisor' && !['dispatch', 'attendance'].includes(moduleName)) {
      return res.status(403).json({ error: 'Access denied. You can only export Dispatch or Attendance records.' });
    }

    let csvContent = '';
    const filename = `${moduleName}_report_${new Date().toISOString().split('T')[0]}.csv`;

    if (moduleName === 'attendance') {
      csvContent = await exportService.generateAttendanceCsv(startDate, endDate);
    } else {
      csvContent = await exportService.generateProductionCsv(moduleName, startDate, endDate);
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('Error generating export file:', err);
    res.status(500).json({ error: 'Failed to generate export file.' });
  }
});

module.exports = router;
