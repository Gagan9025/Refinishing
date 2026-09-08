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

async function seedLastMonthData() {
  console.log('Generating 30 days of past production & attendance records...');

  const today = new Date('2026-09-08');

  for (let i = 30; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = getFormattedDate(d);

    // Skip Sundays
    if (d.getDay() === 0) {
      console.log(`Skipping Sunday: ${dateStr}`);
      continue;
    }

    // 1. Scanning Production
    const scanTarget = 800;
    const scanHourlyTarget = 100;
    const scanSlots = {
      slot_1: Math.floor(90 + Math.random() * 20),
      slot_2: Math.floor(92 + Math.random() * 20),
      slot_3: Math.floor(95 + Math.random() * 20),
      slot_4: Math.floor(90 + Math.random() * 20),
      slot_5: Math.floor(98 + Math.random() * 20),
      slot_6: Math.floor(95 + Math.random() * 20),
      slot_7: Math.floor(92 + Math.random() * 20),
      slot_8: Math.floor(94 + Math.random() * 20)
    };
    const scanTotal = Object.values(scanSlots).reduce((a, b) => a + b, 0);
    const scanDocId = `scanning_${dateStr}`;
    await dbService.setDocument('scanningProduction', scanDocId, {
      date: dateStr,
      supervisorId: 'scan.supervisor',
      supervisorName: 'Scanning Supervisor',
      dailyTarget: scanTarget,
      hourlyTarget: scanHourlyTarget,
      hourlyData: scanSlots,
      totalAchieved: scanTotal,
      pending: Math.max(0, scanTarget - scanTotal),
      achievementPercentage: Number(((scanTotal / scanTarget) * 100).toFixed(2)),
      updatedBy: 'scan.supervisor',
      updatedAt: d.toISOString(),
      createdAt: d.toISOString()
    });

    // 2. Batch Production
    const batchTarget = 400;
    const batchHourlyTarget = 50;
    const batchSlots = {
      slot_1: Math.floor(45 + Math.random() * 10),
      slot_2: Math.floor(48 + Math.random() * 10),
      slot_3: Math.floor(47 + Math.random() * 10),
      slot_4: Math.floor(46 + Math.random() * 10),
      slot_5: Math.floor(50 + Math.random() * 10),
      slot_6: Math.floor(48 + Math.random() * 10),
      slot_7: Math.floor(46 + Math.random() * 10),
      slot_8: Math.floor(49 + Math.random() * 10)
    };
    const batchTotal = Object.values(batchSlots).reduce((a, b) => a + b, 0);
    const batchDocId = `batch_${dateStr}`;
    await dbService.setDocument('batchProduction', batchDocId, {
      date: dateStr,
      supervisorId: 'batch.supervisor',
      supervisorName: 'Batch Supervisor',
      dailyTarget: batchTarget,
      hourlyTarget: batchHourlyTarget,
      hourlyData: batchSlots,
      totalAchieved: batchTotal,
      pending: Math.max(0, batchTarget - batchTotal),
      achievementPercentage: Number(((batchTotal / batchTarget) * 100).toFixed(2)),
      updatedBy: 'batch.supervisor',
      updatedAt: d.toISOString(),
      createdAt: d.toISOString()
    });

    // 3. Attendance
    const records = EMPLOYEES.map((name, idx) => {
      const isPresent = Math.random() > 0.08; // 92% attendance rate
      return {
        employeeId: `EMP${String(idx + 1).padStart(3, '0')}`,
        employeeName: name,
        status: isPresent ? 'Present' : 'Absent',
        time: isPresent ? '08:25 AM' : '—'
      };
    });

    const presentCount = records.filter(r => r.status === 'Present').length;
    const absentCount = records.length - presentCount;
    const attendancePercentage = Number(((presentCount / records.length) * 100).toFixed(2));
    const attendanceDocId = `attendance_${dateStr}`;

    await dbService.setDocument('attendance', attendanceDocId, {
      date: dateStr,
      totalEmployees: records.length,
      presentCount,
      absentCount,
      attendancePercentage,
      records,
      markedBy: 'dispatch.supervisor',
      updatedAt: d.toISOString(),
      createdAt: d.toISOString()
    });

    console.log(`[Seeded ${dateStr}] Scan: ${scanTotal}/${scanTarget} | Batch: ${batchTotal}/${batchTarget} | Att: ${presentCount}/${records.length}`);
  }

  console.log('✅ Successfully populated 30 days of production and attendance records into the database!');
}

seedLastMonthData().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
