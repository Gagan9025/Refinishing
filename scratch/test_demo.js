const dbService = require('../backend/services/dbService');
const exportService = require('../backend/services/exportService');

async function runDemoTest() {
  console.log('=== STARTING DEMO VERIFICATION TEST ===');

  // Local date helper
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterdayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  console.log(`Testing with Yesterday's Date: ${yesterdayStr}`);

  // 1. Save Scanning Target for Yesterday
  const scanDocId = `scanning_${yesterdayStr}`;
  const scanDoc = {
    date: yesterdayStr,
    supervisorId: 'scan.supervisor',
    supervisorName: 'Scanning Supervisor',
    dailyTarget: 800,
    hourlyTarget: 100,
    hourlyData: {
      slot_1: 105,
      slot_2: 98,
      slot_3: 110,
      slot_4: 95,
      slot_5: 102,
      slot_6: 100,
      slot_7: 96,
      slot_8: 104
    },
    totalAchieved: 810,
    pending: 0,
    achievementPercentage: 101.25,
    updatedBy: 'scan.supervisor',
    updatedAt: new Date().toISOString()
  };
  await dbService.setDocument('scanningProduction', scanDocId, scanDoc, true);
  console.log('✔ Scanning data saved for yesterday in database.');

  // 2. Save Batch Target for Yesterday
  const batchDocId = `batch_${yesterdayStr}`;
  const batchDoc = {
    date: yesterdayStr,
    supervisorId: 'batch.supervisor',
    supervisorName: 'Batch Supervisor',
    dailyTarget: 600,
    hourlyTarget: 75,
    hourlyData: {
      slot_1: 75,
      slot_2: 80,
      slot_3: 70,
      slot_4: 78,
      slot_5: 82,
      slot_6: 74,
      slot_7: 76,
      slot_8: 80
    },
    totalAchieved: 615,
    pending: 0,
    achievementPercentage: 102.5,
    updatedBy: 'batch.supervisor',
    updatedAt: new Date().toISOString()
  };
  await dbService.setDocument('batchProduction', batchDocId, batchDoc, true);
  console.log('✔ Batch production data saved for yesterday in database.');

  // 3. Save Attendance for Yesterday
  const attDocId = `attendance_${yesterdayStr}`;
  const attDoc = {
    date: yesterdayStr,
    totalEmployees: 50,
    presentCount: 47,
    absentCount: 3,
    attendancePercentage: 94,
    records: [
      { employeeId: 'EMP001', employeeName: 'Alex Johnson', status: 'Present', time: '08:25 AM' },
      { employeeId: 'EMP002', employeeName: 'Beatriz Silva', status: 'Present', time: '08:28 AM' },
      { employeeId: 'EMP003', employeeName: 'Carlos Mendez', status: 'Absent', time: '—' }
    ],
    markedBy: 'dispatch.supervisor',
    updatedAt: new Date().toISOString()
  };
  await dbService.setDocument('attendance', attDocId, attDoc, true);
  console.log('✔ Attendance data saved for yesterday in database.');

  // 4. Verify Database Read for Yesterday
  const fetchedScan = await dbService.getDocument('scanningProduction', scanDocId);
  console.log(`✔ Read Scanning Record for ${yesterdayStr}: Target=${fetchedScan.dailyTarget}, Achieved=${fetchedScan.totalAchieved}, Ach%=${fetchedScan.achievementPercentage}%`);

  // 5. Generate Excel Export for Yesterday
  const scanExcel = await exportService.generateProductionExcel('scanning', yesterdayStr, yesterdayStr);
  console.log(`✔ Generated Scanning Excel Report for ${yesterdayStr} (Length: ${scanExcel.length} chars)`);

  const attExcel = await exportService.generateAttendanceExcel(yesterdayStr, yesterdayStr);
  console.log(`✔ Generated Attendance Excel Report for ${yesterdayStr} (Length: ${attExcel.length} chars)`);

  // 6. Generate CSV Export for Yesterday
  const scanCsv = await exportService.generateProductionCsv('scanning', yesterdayStr, yesterdayStr);
  console.log(`✔ Generated Scanning CSV Report for ${yesterdayStr} (Lines: ${scanCsv.split('\r\n').length})`);

  console.log('=== ALL DEMO TESTS PASSED SUCCESSFULLY! ===');
}

runDemoTest().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
