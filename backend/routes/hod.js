const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const ALLOWED_ROLES = ['hod', 'admin'];

function getLocalDateString(d = new Date()) {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateRangeBounds(rangeType, customStart, customEnd) {
  const todayStr = getLocalDateString();

  if (rangeType === 'yesterday') {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yStr = getLocalDateString(y);
    return { startDate: yStr, endDate: yStr };
  }

  if (rangeType === 'weekly') {
    const w = new Date();
    w.setDate(w.getDate() - 7);
    return { startDate: getLocalDateString(w), endDate: todayStr };
  }

  if (rangeType === 'monthly') {
    const m = new Date();
    m.setDate(m.getDate() - 30);
    return { startDate: getLocalDateString(m), endDate: todayStr };
  }

  if (rangeType === 'custom' && customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd };
  }

  return { startDate: todayStr, endDate: todayStr };
}

router.get('/overview', authenticateToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const { rangeType, startDate, endDate, date } = req.query;

    const selectedDate = date || new Date().toISOString().split('T')[0];
    const bounds = rangeType ? getDateRangeBounds(rangeType, startDate, endDate) : { startDate: selectedDate, endDate: selectedDate };

    const scanningDocs = await dbService.getCollection('scanningProduction');
    const batchDocs = await dbService.getCollection('batchProduction');
    const attendanceDocs = await dbService.getCollection('attendance');

    const filterByDate = (list) => list.filter(item => item.date >= bounds.startDate && item.date <= bounds.endDate);

    const filteredScan = filterByDate(scanningDocs);
    const filteredBatch = filterByDate(batchDocs);
    const filteredAttendance = filterByDate(attendanceDocs);

    // Aggregate Scanning
    let scanTarget = 0, scanAchieved = 0;
    filteredScan.forEach(doc => {
      scanTarget += (doc.dailyTarget || 0);
      scanAchieved += (doc.totalAchieved || 0);
    });
    const scanAchievement = scanTarget > 0 ? Number(((scanAchieved / scanTarget) * 100).toFixed(2)) : 0;

    // Aggregate Batch
    let batchTarget = 0, batchAchieved = 0;
    filteredBatch.forEach(doc => {
      batchTarget += (doc.dailyTarget || 0);
      batchAchieved += (doc.totalAchieved || 0);
    });
    const batchAchievement = batchTarget > 0 ? Number(((batchAchieved / batchTarget) * 100).toFixed(2)) : 0;

    // Aggregate Attendance
    let attTotal = 0, attPresent = 0, attAbsent = 0;
    filteredAttendance.forEach(doc => {
      attTotal += (doc.totalEmployees || 0);
      attPresent += (doc.presentCount || 0);
      attAbsent += (doc.absentCount || 0);
    });
    const attPercentage = attTotal > 0 ? Number(((attPresent / attTotal) * 100).toFixed(2)) : 0;

    res.json({
      success: true,
      bounds,
      date: selectedDate,
      summary: {
        scanning: { target: scanTarget, achieved: scanAchieved, achievementPercentage: scanAchievement },
        batch: { target: batchTarget, achieved: batchAchieved, achievementPercentage: batchAchievement },
        attendance: { totalEmployees: attTotal, present: attPresent, absent: attAbsent, attendancePercentage: attPercentage }
      }
    });
  } catch (err) {
    console.error('Error fetching HOD overview:', err);
    res.status(500).json({ error: 'Unable to load HOD overview data.' });
  }
});

router.get('/supervisor-view', authenticateToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const { module: targetModule, date } = req.query;
    const selectedDate = date || new Date().toISOString().split('T')[0];

    let collectionName = 'scanningProduction';
    if (targetModule === 'batch') collectionName = 'batchProduction';

    const docId = `${targetModule || 'scanning'}_${selectedDate}`;
    const data = await dbService.getDocument(collectionName, docId);

    res.json({ success: true, module: targetModule || 'scanning', date: selectedDate, data });
  } catch (err) {
    console.error('Error fetching supervisor view:', err);
    res.status(500).json({ error: 'Unable to fetch supervisor view data.' });
  }
});

router.get('/comparison', authenticateToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const { date } = req.query;
    const selectedDate = date || new Date().toISOString().split('T')[0];

    const scanDoc = await dbService.getDocument('scanningProduction', `scanning_${selectedDate}`);
    const batchDoc = await dbService.getDocument('batchProduction', `batch_${selectedDate}`);

    res.json({
      success: true,
      date: selectedDate,
      comparison: [
        {
          module: 'Scanning Production',
          supervisor: scanDoc ? scanDoc.supervisorName : 'Scanning Supervisor',
          target: scanDoc ? scanDoc.dailyTarget : 0,
          achieved: scanDoc ? scanDoc.totalAchieved : 0,
          pending: scanDoc ? scanDoc.pending : 0,
          achievementPercentage: scanDoc ? scanDoc.achievementPercentage : 0
        },
        {
          module: 'Batch Production',
          supervisor: batchDoc ? batchDoc.supervisorName : 'Batch Supervisor',
          target: batchDoc ? batchDoc.dailyTarget : 0,
          achieved: batchDoc ? batchDoc.totalAchieved : 0,
          pending: batchDoc ? batchDoc.pending : 0,
          achievementPercentage: batchDoc ? batchDoc.achievementPercentage : 0
        }
      ]
    });
  } catch (err) {
    console.error('Error fetching comparison data:', err);
    res.status(500).json({ error: 'Unable to fetch comparison data.' });
  }
});

module.exports = router;
