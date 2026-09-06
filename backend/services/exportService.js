const dbService = require('./dbService');

const WORKING_SLOTS = [
  { slotId: 'slot_1', time: '8:30 AM – 9:30 AM' },
  { slotId: 'slot_2', time: '9:30 AM – 10:30 AM' },
  { slotId: 'slot_3', time: '10:30 AM – 11:30 AM' },
  { slotId: 'slot_4', time: '11:30 AM – 12:30 PM' },
  { slotId: 'slot_lunch', time: '12:30 PM – 1:00 PM', isLunch: true },
  { slotId: 'slot_5', time: '1:00 PM – 2:00 PM' },
  { slotId: 'slot_6', time: '2:00 PM – 3:00 PM' },
  { slotId: 'slot_7', time: '3:00 PM – 4:00 PM' },
  { slotId: 'slot_8', time: '4:00 PM – 5:00 PM' }
];

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

async function generateProductionCsv(moduleName, startDate, endDate) {
  if (moduleName === 'dispatch') {
    return generateDispatchVehiclesCsv(startDate, endDate);
  }

  let collectionName = 'scanningProduction';
  if (moduleName === 'batch') collectionName = 'batchProduction';

  let records = await dbService.getCollection(collectionName);

  if (startDate) records = records.filter(r => r.date >= startDate);
  if (endDate) records = records.filter(r => r.date <= endDate);

  records.sort((a, b) => a.date.localeCompare(b.date));

  const rows = [];
  rows.push(['Date', 'Supervisor', 'Daily Target', 'Time Slot', 'Hourly Target', 'Achieved', 'Difference', 'Achievement %', 'Status', 'Entry Time'].map(escapeCsvField).join(','));

  for (const doc of records) {
    const hourlyData = doc.hourlyData || {};
    const hourlyTarget = doc.hourlyTarget || 0;

    for (const slot of WORKING_SLOTS) {
      if (slot.isLunch) {
        rows.push([
          doc.date,
          doc.supervisorName || doc.supervisorId || '',
          doc.dailyTarget || 0,
          slot.time,
          '—',
          '—',
          '—',
          '—',
          'LUNCH',
          '—'
        ].map(escapeCsvField).join(','));
        continue;
      }

      const achieved = hourlyData[slot.slotId] !== undefined ? hourlyData[slot.slotId] : '—';
      let diff = '—';
      let achPct = '—';
      let status = 'Upcoming';

      if (achieved !== '—') {
        const achNum = parseInt(achieved, 10);
        const diffNum = achNum - hourlyTarget;
        diff = diffNum >= 0 ? `+${diffNum}` : `${diffNum}`;
        achPct = hourlyTarget > 0 ? `${((achNum / hourlyTarget) * 100).toFixed(1)}%` : '0%';
        if (diffNum < 0) status = 'Below Target';
        else if (diffNum === 0) status = 'Achieved';
        else status = 'Exceeded';
      }

      rows.push([
        doc.date,
        doc.supervisorName || doc.supervisorId || '',
        doc.dailyTarget || 0,
        slot.time,
        hourlyTarget,
        achieved,
        diff,
        achPct,
        status,
        doc.updatedAt ? new Date(doc.updatedAt).toLocaleTimeString() : '—'
      ].map(escapeCsvField).join(','));
    }
  }

  return '\uFEFF' + rows.join('\r\n');
}

async function generateDispatchVehiclesCsv(startDate, endDate) {
  let records = await dbService.getCollection('dispatchProduction');

  if (startDate) records = records.filter(r => r.date >= startDate);
  if (endDate) records = records.filter(r => r.date <= endDate);

  records.sort((a, b) => a.date.localeCompare(b.date));

  const rows = [];
  rows.push(['Date', 'Vehicle Number', 'Operation Type', 'Material / Cargo', 'Driver Name', 'Arrival Time', 'Status', 'Completion Time', 'Supervisor'].map(escapeCsvField).join(','));

  for (const doc of records) {
    const vehicles = doc.vehicles || [];
    if (vehicles.length === 0) {
      rows.push([
        doc.date,
        '—',
        'Summary',
        `Unload Target: ${doc.targetUnload || 0}, Load Target: ${doc.targetLoad || 0}`,
        '—',
        '—',
        `Completed: ${doc.totalCompleted || 0}/${doc.totalVehiclesTarget || 0}`,
        '—',
        doc.supervisorName || doc.supervisorId || ''
      ].map(escapeCsvField).join(','));
      continue;
    }

    for (const v of vehicles) {
      rows.push([
        doc.date,
        v.vehicleNumber,
        v.type,
        v.material,
        v.driverName,
        v.arrivalTime,
        v.status,
        v.completionTime || '—',
        doc.supervisorName || doc.supervisorId || ''
      ].map(escapeCsvField).join(','));
    }
  }

  return '\uFEFF' + rows.join('\r\n');
}

async function generateAttendanceCsv(startDate, endDate) {
  let records = await dbService.getCollection('attendance');

  if (startDate) records = records.filter(r => r.date >= startDate);
  if (endDate) records = records.filter(r => r.date <= endDate);

  records.sort((a, b) => a.date.localeCompare(b.date));

  const rows = [];
  rows.push(['Date', 'Employee ID', 'Employee Name', 'Status', 'Time', 'Supervisor'].map(escapeCsvField).join(','));

  for (const doc of records) {
    const list = doc.records || [];
    for (const emp of list) {
      rows.push([
        doc.date,
        emp.employeeId,
        emp.employeeName,
        emp.status,
        emp.time || '—',
        doc.markedBy || 'dispatch.supervisor'
      ].map(escapeCsvField).join(','));
    }
  }

  return '\uFEFF' + rows.join('\r\n');
}

module.exports = {
  generateProductionCsv,
  generateAttendanceCsv
};
