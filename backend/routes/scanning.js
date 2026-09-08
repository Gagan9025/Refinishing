const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const COLLECTION_NAME = 'scanningProduction';
const ALLOWED_ROLES = ['scanning_supervisor', 'hod', 'admin'];

function getLocalDateString(d = new Date()) {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get scanning production data for a date
router.get('/data', authenticateToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const date = req.query.date || getLocalDateString();
    const docId = `scanning_${date}`;

    let data = await dbService.getDocument(COLLECTION_NAME, docId);

    if (!data) {
      data = {
        date,
        supervisorId: req.user.username,
        supervisorName: req.user.name,
        dailyTarget: 0,
        hourlyTarget: 0,
        hourlyData: {},
        totalAchieved: 0,
        pending: 0,
        achievementPercentage: 0,
        isNew: true
      };
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('Error getting scanning data:', err);
    res.status(500).json({ error: 'Unable to retrieve scanning production data.' });
  }
});

// Set daily target
router.post('/target', authenticateToken, requireRole('scanning_supervisor', 'admin'), async (req, res) => {
  try {
    const { date, dailyTarget } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required.' });
    }

    const targetNum = parseInt(dailyTarget, 10);
    if (isNaN(targetNum) || targetNum <= 0) {
      return res.status(400).json({ error: 'Daily target must be a valid positive number greater than 0.' });
    }

    const docId = `scanning_${date}`;
    let existing = await dbService.getDocument(COLLECTION_NAME, docId);

    const hourlyTarget = Number((targetNum / 8).toFixed(2));
    const hourlyData = existing ? (existing.hourlyData || {}) : {};

    let totalAchieved = 0;
    Object.values(hourlyData).forEach(val => {
      totalAchieved += (parseInt(val, 10) || 0);
    });

    const pending = Math.max(0, targetNum - totalAchieved);
    const achievementPercentage = Number(((totalAchieved / targetNum) * 100).toFixed(2));

    const updatedDoc = {
      date,
      supervisorId: req.user.username,
      supervisorName: req.user.name,
      dailyTarget: targetNum,
      hourlyTarget,
      hourlyData,
      totalAchieved,
      pending,
      achievementPercentage,
      updatedBy: req.user.username,
      updatedAt: new Date().toISOString()
    };

    const saved = await dbService.setDocument(COLLECTION_NAME, docId, updatedDoc, true);
    res.json({ success: true, message: 'Daily target set successfully.', data: saved });
  } catch (err) {
    console.error('Error saving scanning target:', err);
    res.status(500).json({ error: 'Unable to save daily target. Please try again.' });
  }
});

// Submit/update hourly achieved entry
router.post('/hourly', authenticateToken, requireRole('scanning_supervisor', 'admin'), async (req, res) => {
  try {
    const { date, slotId, achieved } = req.body;

    if (!date || !slotId) {
      return res.status(400).json({ error: 'Date and Slot ID are required.' });
    }

    if (slotId === 'slot_lunch') {
      return res.status(400).json({ error: 'Production entry is not allowed during lunch break.' });
    }

    const achievedNum = parseInt(achieved, 10);
    if (isNaN(achievedNum) || achievedNum < 0) {
      return res.status(400).json({ error: 'Achieved quantity must be 0 or a positive number.' });
    }

    const docId = `scanning_${date}`;
    let existing = await dbService.getDocument(COLLECTION_NAME, docId);

    if (!existing || !existing.dailyTarget || existing.dailyTarget <= 0) {
      return res.status(400).json({ error: 'Please set a daily target before entering hourly production.' });
    }

    const hourlyData = { ...(existing.hourlyData || {}), [slotId]: achievedNum };

    let totalAchieved = 0;
    Object.values(hourlyData).forEach(val => {
      totalAchieved += (parseInt(val, 10) || 0);
    });

    const pending = Math.max(0, existing.dailyTarget - totalAchieved);
    const achievementPercentage = Number(((totalAchieved / existing.dailyTarget) * 100).toFixed(2));

    const updatedDoc = {
      ...existing,
      hourlyData,
      totalAchieved,
      pending,
      achievementPercentage,
      updatedBy: req.user.username,
      updatedAt: new Date().toISOString()
    };

    const saved = await dbService.setDocument(COLLECTION_NAME, docId, updatedDoc, true);
    res.json({ success: true, message: 'Hourly production saved successfully.', data: saved });
  } catch (err) {
    console.error('Error saving hourly production:', err);
    res.status(500).json({ error: 'Unable to save production data. Please try again.' });
  }
});

// Reset scanning data for a date back to 0
router.post('/reset', authenticateToken, requireRole('scanning_supervisor', 'admin'), async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'Date is required.' });
    }

    const docId = `scanning_${date}`;
    const freshDoc = {
      date,
      supervisorId: req.user.username,
      supervisorName: req.user.name,
      dailyTarget: 0,
      hourlyTarget: 0,
      hourlyData: {},
      totalAchieved: 0,
      pending: 0,
      achievementPercentage: 0,
      updatedBy: req.user.username,
      updatedAt: new Date().toISOString()
    };

    const saved = await dbService.setDocument(COLLECTION_NAME, docId, freshDoc, false);
    res.json({ success: true, message: `Production data for ${date} has been reset to 0.`, data: saved });
  } catch (err) {
    console.error('Error resetting scanning data:', err);
    res.status(500).json({ error: 'Unable to reset production data.' });
  }
});

// Get history
router.get('/history', authenticateToken, requireRole(...ALLOWED_ROLES), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let records = await dbService.getCollection(COLLECTION_NAME);

    if (startDate) {
      records = records.filter(r => r.date >= startDate);
    }
    if (endDate) {
      records = records.filter(r => r.date <= endDate);
    }

    records.sort((a, b) => b.date.localeCompare(a.date));

    res.json({ success: true, records });
  } catch (err) {
    console.error('Error fetching scanning history:', err);
    res.status(500).json({ error: 'Unable to fetch scanning history.' });
  }
});

module.exports = router;
