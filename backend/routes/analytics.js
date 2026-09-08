const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const { authenticateToken } = require('../middleware/auth');

// Get Revenue & Production Analytics with Daily / Weekly / Monthly Filters
router.get('/revenue-production', authenticateToken, async (req, res) => {
  try {
    const timeframe = (req.query.timeframe || 'monthly').toLowerCase(); // 'daily', 'weekly', 'monthly'
    const dailySummaries = await dbService.getCollection('dailySummaries');
    const scanningDocs = await dbService.getCollection('scanningProduction');
    const batchDocs = await dbService.getCollection('batchProduction');

    // Combine scan & batch docs if dailySummaries isn't populated for older records
    const dateMap = {};

    dailySummaries.forEach(item => {
      if (item.date) {
        dateMap[item.date] = {
          date: item.date,
          target: item.target || 8000,
          scanTotal: item.scanTotal || 0,
          batchTotal: item.batchTotal || 0,
          totalProduction: item.totalProduction || ((item.scanTotal || 0) + (item.batchTotal || 0)),
          unitPrice: item.unitPrice || 150,
          grossRevenue: item.grossRevenue || ((item.totalProduction || 0) * 150)
        };
      }
    });

    scanningDocs.forEach(item => {
      if (item.date && !dateMap[item.date]) {
        const scan = item.totalScanned || 0;
        dateMap[item.date] = {
          date: item.date,
          target: 8000,
          scanTotal: scan,
          batchTotal: 0,
          totalProduction: scan,
          unitPrice: 150,
          grossRevenue: scan * 150
        };
      } else if (item.date && dateMap[item.date]) {
        dateMap[item.date].scanTotal = item.totalScanned || dateMap[item.date].scanTotal;
        dateMap[item.date].totalProduction = dateMap[item.date].scanTotal + dateMap[item.date].batchTotal;
        dateMap[item.date].grossRevenue = dateMap[item.date].totalProduction * 150;
      }
    });

    batchDocs.forEach(item => {
      if (item.date && !dateMap[item.date]) {
        const batch = item.totalBatched || 0;
        dateMap[item.date] = {
          date: item.date,
          target: 8000,
          scanTotal: 0,
          batchTotal: batch,
          totalProduction: batch,
          unitPrice: 150,
          grossRevenue: batch * 150
        };
      } else if (item.date && dateMap[item.date]) {
        dateMap[item.date].batchTotal = item.totalBatched || dateMap[item.date].batchTotal;
        dateMap[item.date].totalProduction = dateMap[item.date].scanTotal + dateMap[item.date].batchTotal;
        dateMap[item.date].grossRevenue = dateMap[item.date].totalProduction * 150;
      }
    });

    // Sort all dates chronologically
    const allDates = Object.keys(dateMap).sort();
    const records = allDates.map(d => dateMap[d]);

    // Aggregate depending on timeframe (daily, weekly, monthly)
    let aggregatedData = [];

    if (timeframe === 'daily') {
      // Return last 30 daily records
      const last30 = records.slice(-30);
      aggregatedData = last30.map(r => ({
        label: r.date,
        target: r.target,
        actualProduction: r.totalProduction,
        scanTotal: r.scanTotal,
        batchTotal: r.batchTotal,
        unitPrice: r.unitPrice,
        revenue: r.grossRevenue,
        variance: r.totalProduction - r.target,
        completionRate: Number(((r.totalProduction / r.target) * 100).toFixed(1)),
        status: r.totalProduction >= r.target ? 'ACHIEVED' : 'NEAR TARGET'
      }));
    } else if (timeframe === 'weekly') {
      // Group by ISO/Calendar Week
      const weekGroups = {};
      records.forEach(r => {
        const dObj = new Date(r.date);
        const year = dObj.getFullYear();
        // Compute week number
        const startOfYear = new Date(year, 0, 1);
        const pastDaysOfYear = (dObj - startOfYear) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`;

        if (!weekGroups[weekKey]) {
          weekGroups[weekKey] = {
            label: weekKey,
            workingDays: 0,
            target: 0,
            actualProduction: 0,
            scanTotal: 0,
            batchTotal: 0,
            revenue: 0
          };
        }
        weekGroups[weekKey].workingDays += 1;
        weekGroups[weekKey].target += r.target;
        weekGroups[weekKey].actualProduction += r.totalProduction;
        weekGroups[weekKey].scanTotal += r.scanTotal;
        weekGroups[weekKey].batchTotal += r.batchTotal;
        weekGroups[weekKey].revenue += r.grossRevenue;
      });

      const keys = Object.keys(weekGroups).sort().slice(-16); // Last 16 weeks
      aggregatedData = keys.map(k => {
        const wg = weekGroups[k];
        return {
          label: wg.label,
          workingDays: wg.workingDays,
          target: 48000, // 8,000 * 6 days
          actualProduction: wg.actualProduction,
          scanTotal: wg.scanTotal,
          batchTotal: wg.batchTotal,
          unitPrice: 150,
          revenue: wg.revenue,
          variance: wg.actualProduction - 48000,
          completionRate: Number(((wg.actualProduction / 48000) * 100).toFixed(1)),
          status: wg.actualProduction >= 48000 ? 'ACHIEVED' : 'NEAR TARGET'
        };
      });
    } else {
      // Default: Monthly grouping (last 12 months)
      const monthGroups = {};
      records.forEach(r => {
        const monthKey = r.date.substring(0, 7); // YYYY-MM
        if (!monthGroups[monthKey]) {
          monthGroups[monthKey] = {
            label: monthKey,
            workingDays: 0,
            target: 0,
            actualProduction: 0,
            scanTotal: 0,
            batchTotal: 0,
            revenue: 0
          };
        }
        monthGroups[monthKey].workingDays += 1;
        monthGroups[monthKey].target += r.target;
        monthGroups[monthKey].actualProduction += r.totalProduction;
        monthGroups[monthKey].scanTotal += r.scanTotal;
        monthGroups[monthKey].batchTotal += r.batchTotal;
        monthGroups[monthKey].revenue += r.grossRevenue;
      });

      const keys = Object.keys(monthGroups).sort().slice(-12); // Last 12 months
      aggregatedData = keys.map(k => {
        const mg = monthGroups[k];
        const monthlyTarget = 208000; // 8,000 * 26 days
        return {
          label: mg.label,
          workingDays: mg.workingDays,
          target: monthlyTarget,
          actualProduction: mg.actualProduction,
          scanTotal: mg.scanTotal,
          batchTotal: mg.batchTotal,
          unitPrice: 150,
          revenue: mg.revenue,
          variance: mg.actualProduction - monthlyTarget,
          completionRate: Number(((mg.actualProduction / monthlyTarget) * 100).toFixed(1)),
          status: mg.actualProduction >= monthlyTarget ? 'ACHIEVED' : 'NEAR TARGET'
        };
      });
    }

    // Overall summary calculations
    const totalProduction = records.reduce((sum, r) => sum + r.totalProduction, 0);
    const totalRevenue = records.reduce((sum, r) => sum + r.grossRevenue, 0);
    const totalWorkingDays = records.length;

    res.json({
      timeframe,
      summary: {
        dailyTarget: 8000,
        weeklyTarget: 48000,
        monthlyTarget: 208000,
        totalWorkingDays,
        totalProduction,
        totalRevenue,
        averageDailyProduction: totalWorkingDays > 0 ? Math.round(totalProduction / totalWorkingDays) : 0,
        averageDailyRevenue: totalWorkingDays > 0 ? Math.round(totalRevenue / totalWorkingDays) : 0
      },
      data: aggregatedData
    });
  } catch (err) {
    console.error('Error fetching analytics data:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics data.' });
  }
});

module.exports = router;
