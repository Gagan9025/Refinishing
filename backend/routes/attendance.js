const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const COLLECTION_NAME = 'attendance';
const ALLOWED_ROLES = ['dispatch_supervisor', 'hod', 'admin'];

function getLocalDateString(d = new Date()) {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get attendance for a specific date
router.get('/', authenticateToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const date = req.query.date || getLocalDateString();
    const docId = `attendance_${date}`;

    let data = await dbService.getDocument(COLLECTION_NAME, docId);

    if (!data) {
      const empNames = [
        'Alex Johnson', 'Beatriz Silva', 'Carlos Mendez', 'David Kim', 'Elena Rostova',
        'Farhan Akhtar', 'Grace Chen', 'Hassan Ali', 'Irene Adler', 'Jamal Crawford',
        'Kevin Patel', 'Laura Palmer', 'Marcus Vance', 'Nina Dobrev', 'Omar Farooq',
        'Pradeep Sharma', 'Qasim Khan', 'Rachel Green', 'Siddharth Rao', 'Tariq Mahmood',
        'Umar Farooq', 'Victor Hugo', 'Winston Smith', 'Xavier Dupont', 'Yousuf Raza',
        'Zainab Malik', 'Aaron Paul', 'Bryan Cranston', 'Claire Danes', 'Daniel Craig',
        'Emily Blunt', 'Frank Castle', 'George Clooney', 'Hannah Abbott', 'Ian McKellen',
        'John Wick', 'Kate Winslet', 'Liam Neeson', 'Morgan Freeman', 'Naomi Watts',
        'Oliver Stone', 'Peter Parker', 'Quentin Tarantino', 'Robert DeNiro', 'Steve Rogers',
        'Tom Hardy', 'Uma Thurman', 'Vin Diesel', 'Will Smith', 'Zendaya Coleman'
      ];

      const records = empNames.map((name, idx) => ({
        employeeId: `EMP${String(idx + 1).padStart(3, '0')}`,
        employeeName: name,
        status: 'Unmarked',
        time: '—'
      }));

      data = {
        date,
        totalEmployees: records.length,
        presentCount: 0,
        absentCount: 0,
        attendancePercentage: 0,
        records,
        markedBy: req.user.username,
        isNew: true
      };
      
      await dbService.setDocument(COLLECTION_NAME, docId, data, true);
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ error: 'Unable to retrieve attendance data.' });
  }
});

// Update employee attendance status
router.post('/status', authenticateToken, requireRole('dispatch_supervisor', 'admin'), async (req, res) => {
  try {
    const { date, employeeId, status } = req.body;

    if (!date || !employeeId || !status) {
      return res.status(400).json({ error: 'Date, Employee ID, and Status are required.' });
    }

    if (!['Present', 'Absent'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either Present or Absent.' });
    }

    const docId = `attendance_${date}`;
    let data = await dbService.getDocument(COLLECTION_NAME, docId);

    if (!data || !data.records) {
      return res.status(400).json({ error: 'No attendance roster initialized for this date.' });
    }

    const records = data.records.map(emp => {
      if (emp.employeeId === employeeId) {
        const timeStr = status === 'Present' 
          ? (emp.time && emp.time !== '—' ? emp.time : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
          : '—';
        return {
          ...emp,
          status,
          time: timeStr
        };
      }
      return emp;
    });

    const presentCount = records.filter(r => r.status === 'Present').length;
    const absentCount = records.filter(r => r.status === 'Absent').length;
    const totalEmployees = records.length;
    const attendancePercentage = totalEmployees > 0 ? Number(((presentCount / totalEmployees) * 100).toFixed(2)) : 0;

    const updatedDoc = {
      ...data,
      records,
      presentCount,
      absentCount,
      totalEmployees,
      attendancePercentage,
      markedBy: req.user.username,
      updatedAt: new Date().toISOString()
    };

    const saved = await dbService.setDocument(COLLECTION_NAME, docId, updatedDoc, true);
    res.json({ success: true, message: 'Attendance updated successfully.', data: saved });
  } catch (err) {
    console.error('Error updating attendance:', err);
    res.status(500).json({ error: 'Unable to update attendance.' });
  }
});

// Add new employee to daily attendance roster
router.post('/employee', authenticateToken, requireRole('dispatch_supervisor', 'admin'), async (req, res) => {
  try {
    const { date, employeeId, employeeName, status } = req.body;

    if (!date || !employeeId || !employeeName) {
      return res.status(400).json({ error: 'Date, Employee ID, and Employee Name are required.' });
    }

    const docId = `attendance_${date}`;
    let data = await dbService.getDocument(COLLECTION_NAME, docId);

    const empStatus = status === 'Absent' ? 'Absent' : 'Present';
    const timeStr = empStatus === 'Present' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

    let records = data && data.records ? [...data.records] : [];

    const existingIdx = records.findIndex(r => r.employeeId === employeeId);
    if (existingIdx >= 0) {
      records[existingIdx] = {
        employeeId,
        employeeName,
        status: empStatus,
        time: timeStr
      };
    } else {
      records.push({
        employeeId,
        employeeName,
        status: empStatus,
        time: timeStr
      });
    }

    const presentCount = records.filter(r => r.status === 'Present').length;
    const absentCount = records.filter(r => r.status === 'Absent').length;
    const totalEmployees = records.length;
    const attendancePercentage = totalEmployees > 0 ? Number(((presentCount / totalEmployees) * 100).toFixed(2)) : 0;

    const updatedDoc = {
      date,
      totalEmployees,
      presentCount,
      absentCount,
      attendancePercentage,
      records,
      markedBy: req.user.username,
      updatedAt: new Date().toISOString()
    };

    const saved = await dbService.setDocument(COLLECTION_NAME, docId, updatedDoc, true);
    res.json({ success: true, message: 'Employee added to attendance roster.', data: saved });
  } catch (err) {
    console.error('Error adding employee:', err);
    res.status(500).json({ error: 'Unable to add employee to attendance roster.' });
  }
});

// Reset attendance for a date back to 0 Present
router.post('/reset', authenticateToken, requireRole('dispatch_supervisor', 'admin'), async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'Date is required.' });
    }

    const docId = `attendance_${date}`;
    let data = await dbService.getDocument(COLLECTION_NAME, docId);

    const records = (data && data.records ? data.records : []).map(emp => ({
      ...emp,
      status: 'Absent',
      time: '—'
    }));

    const freshDoc = {
      date,
      totalEmployees: records.length,
      presentCount: 0,
      absentCount: records.length,
      attendancePercentage: 0,
      records,
      markedBy: req.user.username,
      updatedAt: new Date().toISOString()
    };

    const saved = await dbService.setDocument(COLLECTION_NAME, docId, freshDoc, false);
    res.json({ success: true, message: `Attendance for ${date} has been reset to 0 Present.`, data: saved });
  } catch (err) {
    console.error('Error resetting attendance:', err);
    res.status(500).json({ error: 'Unable to reset attendance data.' });
  }
});

module.exports = router;
