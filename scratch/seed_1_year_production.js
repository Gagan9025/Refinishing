const path = require('path');
const dbService = require('../backend/services/dbService');

function getFormattedDate(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const EMPLOYEES = [
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

async function seedOneYearData() {
  console.log('Generating 365 days of 1-year production & revenue records (Sept 2025 - Sept 2026)...');

  const endDate = new Date('2026-09-08');
  let workingDaysCount = 0;
  let totalProductionUnits = 0;

  for (let i = 365; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const dateStr = getFormattedDate(d);

    // Skip Sundays
    if (d.getDay() === 0) {
      continue;
    }

    workingDaysCount++;

    // 1. Scanning Production (Target: 4,000 / day)
    const scanSlots = {
      slot_1: Math.floor(480 + Math.random() * 50),
      slot_2: Math.floor(490 + Math.random() * 50),
      slot_3: Math.floor(500 + Math.random() * 50),
      slot_4: Math.floor(485 + Math.random() * 50),
      slot_5: Math.floor(510 + Math.random() * 50),
      slot_6: Math.floor(495 + Math.random() * 50),
      slot_7: Math.floor(490 + Math.random() * 50),
      slot_8: Math.floor(505 + Math.random() * 50)
    };
    const scanTotal = Object.values(scanSlots).reduce((a, b) => a + b, 0);
    const scanDocId = `scanning_${dateStr}`;
    await dbService.setDocument('scanningProduction', scanDocId, {
      date: dateStr,
      supervisorId: 'scan.supervisor',
      supervisorName: 'Scanning Supervisor',
      dailyTarget: 4000,
      hourlyTarget: 500,
      hourlyData: scanSlots,
      totalScanned: scanTotal,
      status: 'completed',
      updatedAt: `${dateStr}T18:00:00.000Z`,
      createdAt: `${dateStr}T08:00:00.000Z`
    });

    // 2. Batch Production (Target: 4,000 / day)
    const batchSlots = {
      slot_1: Math.floor(480 + Math.random() * 50),
      slot_2: Math.floor(495 + Math.random() * 50),
      slot_3: Math.floor(505 + Math.random() * 50),
      slot_4: Math.floor(490 + Math.random() * 50),
      slot_5: Math.floor(500 + Math.random() * 50),
      slot_6: Math.floor(495 + Math.random() * 50),
      slot_7: Math.floor(500 + Math.random() * 50),
      slot_8: Math.floor(510 + Math.random() * 50)
    };
    const batchTotal = Object.values(batchSlots).reduce((a, b) => a + b, 0);
    const batchDocId = `batch_${dateStr}`;
    await dbService.setDocument('batchProduction', batchDocId, {
      date: dateStr,
      supervisorId: 'batch.supervisor',
      supervisorName: 'Batch Supervisor',
      dailyTarget: 4000,
      hourlyTarget: 500,
      hourlyData: batchSlots,
      totalBatched: batchTotal,
      status: 'completed',
      updatedAt: `${dateStr}T18:00:00.000Z`,
      createdAt: `${dateStr}T08:00:00.000Z`
    });

    // Daily Combined Production (Scanning + Batch = ~8,000 units/day)
    const dailyTotal = scanTotal + batchTotal;
    totalProductionUnits += dailyTotal;

    // Daily Combined Record for Fast Queries
    await dbService.setDocument('dailySummaries', dateStr, {
      date: dateStr,
      target: 8000,
      scanTotal: scanTotal,
      batchTotal: batchTotal,
      totalProduction: dailyTotal,
      unitPrice: 150,
      grossRevenue: dailyTotal * 150,
      achievementRate: Number(((dailyTotal / 8000) * 100).toFixed(1)),
      updatedAt: `${dateStr}T18:30:00.000Z`
    });

    // 3. Attendance Roster (45 - 48 present out of 50)
    const presentCount = Math.floor(45 + Math.random() * 4);
    const attendanceRecords = EMPLOYEES.map((emp, index) => {
      const isPresent = index < presentCount;
      return {
        id: `EMP-${100 + index}`,
        name: emp,
        status: isPresent ? 'present' : 'absent',
        shift: index % 2 === 0 ? 'Morning (08:00 - 16:00)' : 'Evening (16:00 - 00:00)'
      };
    });

    const attDocId = `attendance_${dateStr}`;
    await dbService.setDocument('attendance', attDocId, {
      date: dateStr,
      supervisorId: 'attendance.supervisor',
      supervisorName: 'Attendance Supervisor',
      totalEmployees: 50,
      presentCount: presentCount,
      absentCount: 50 - presentCount,
      records: attendanceRecords,
      updatedAt: `${dateStr}T09:00:00.000Z`,
      createdAt: `${dateStr}T08:00:00.000Z`
    });

    if (i % 30 === 0) {
      console.log(`Seeded date: ${dateStr} | Daily Total: ${dailyTotal} units | Revenue: ₹${(dailyTotal * 150).toLocaleString('en-IN')}`);
    }
  }

  console.log(`\nSuccessfully populated 1 Year of Production History!`);
  console.log(`Total Working Days: ${workingDaysCount} days`);
  console.log(`Total Units Produced: ${totalProductionUnits.toLocaleString()} units`);
  console.log(`Total Gross Revenue: ₹${(totalProductionUnits * 150).toLocaleString('en-IN')}`);
}

seedOneYearData().catch(err => {
  console.error('Error seeding 1 year data:', err);
  process.exit(1);
});
