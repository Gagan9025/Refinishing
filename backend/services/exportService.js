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

function escapeHtml(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function generateProductionCsv(moduleName, startDate, endDate) {
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
        else if (diffNum === 0) status = 'Achieved Target';
        else status = 'Exceeded Target';
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

async function generateProductionExcel(moduleName, startDate, endDate) {
  let collectionName = 'scanningProduction';
  const modTitle = moduleName === 'batch' ? 'Batch Production' : 'Scanning Production';
  if (moduleName === 'batch') collectionName = 'batchProduction';

  let records = await dbService.getCollection(collectionName);

  if (startDate) records = records.filter(r => r.date >= startDate);
  if (endDate) records = records.filter(r => r.date <= endDate);

  records.sort((a, b) => a.date.localeCompare(b.date));

  let tableRowsHtml = '';

  for (const doc of records) {
    const hourlyData = doc.hourlyData || {};
    const hourlyTarget = doc.hourlyTarget || 0;

    for (const slot of WORKING_SLOTS) {
      if (slot.isLunch) {
        tableRowsHtml += `
          <tr style="background-color: #f1f5f9;">
            <td class="center">${escapeHtml(doc.date)}</td>
            <td>${escapeHtml(doc.supervisorName || doc.supervisorId)}</td>
            <td class="right">${doc.dailyTarget || 0}</td>
            <td>${escapeHtml(slot.time)}</td>
            <td class="center">—</td>
            <td class="center">—</td>
            <td class="center">—</td>
            <td class="center">—</td>
            <td class="center"><em>LUNCH BREAK</em></td>
            <td class="center">—</td>
          </tr>
        `;
        continue;
      }

      const achieved = hourlyData[slot.slotId] !== undefined ? hourlyData[slot.slotId] : '—';
      let diff = '—';
      let achPct = '—';
      let status = 'Pending';
      let statusClass = '';

      if (achieved !== '—') {
        const achNum = parseInt(achieved, 10);
        const diffNum = achNum - hourlyTarget;
        diff = diffNum >= 0 ? `+${diffNum}` : `${diffNum}`;
        achPct = hourlyTarget > 0 ? `${((achNum / hourlyTarget) * 100).toFixed(1)}%` : '0%';
        if (diffNum < 0) {
          status = 'Below Target';
          statusClass = 'status-fail';
        } else if (diffNum === 0) {
          status = 'Achieved Target';
          statusClass = 'status-pass';
        } else {
          status = 'Exceeded Target';
          statusClass = 'status-pass';
        }
      }

      tableRowsHtml += `
        <tr>
          <td class="center">${escapeHtml(doc.date)}</td>
          <td>${escapeHtml(doc.supervisorName || doc.supervisorId)}</td>
          <td class="right">${doc.dailyTarget || 0}</td>
          <td>${escapeHtml(slot.time)}</td>
          <td class="right">${hourlyTarget}</td>
          <td class="right"><strong>${achieved}</strong></td>
          <td class="right">${diff}</td>
          <td class="right">${achPct}</td>
          <td class="center ${statusClass}">${status}</td>
          <td class="center">${doc.updatedAt ? new Date(doc.updatedAt).toLocaleTimeString() : '—'}</td>
        </tr>
      `;
    }
  }

  if (records.length === 0) {
    tableRowsHtml = `<tr><td colspan="10" class="center">No production records found for the selected date range.</td></tr>`;
  }

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${escapeHtml(modTitle)}</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 13px; }
        th { background-color: #1e293b; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; }
        td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
        .center { text-align: center; }
        .right { text-align: right; }
        .status-pass { color: #166534; font-weight: bold; }
        .status-fail { color: #991b1b; font-weight: bold; }
        h2 { font-family: Arial, sans-serif; color: #0f172a; margin-bottom: 4px; }
        p { font-family: Arial, sans-serif; color: #475569; font-size: 12px; margin-top: 0; margin-bottom: 12px; }
      </style>
    </head>
    <body>
      <h2>Refinishing Department - ${escapeHtml(modTitle)} Report</h2>
      <p>Date Range: ${startDate || 'All Dates'} to ${endDate || 'All Dates'} | Total Days Logged: ${records.length}</p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Supervisor</th>
            <th>Daily Target</th>
            <th>Time Slot</th>
            <th>Hourly Target</th>
            <th>Achieved</th>
            <th>Difference</th>
            <th>Achievement %</th>
            <th>Status</th>
            <th>Entry Time</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

async function generateAttendanceCsv(startDate, endDate) {
  let records = await dbService.getCollection('attendance');

  if (startDate) records = records.filter(r => r.date >= startDate);
  if (endDate) records = records.filter(r => r.date <= endDate);

  records.sort((a, b) => a.date.localeCompare(b.date));

  const rows = [];
  rows.push(['Date', 'Employee ID', 'Employee Name', 'Status', 'Time Marked', 'Supervisor'].map(escapeCsvField).join(','));

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

async function generateAttendanceExcel(startDate, endDate) {
  let records = await dbService.getCollection('attendance');

  if (startDate) records = records.filter(r => r.date >= startDate);
  if (endDate) records = records.filter(r => r.date <= endDate);

  records.sort((a, b) => a.date.localeCompare(b.date));

  let tableRowsHtml = '';

  for (const doc of records) {
    const list = doc.records || [];
    for (const emp of list) {
      const isPresent = emp.status === 'Present';
      tableRowsHtml += `
        <tr>
          <td class="center">${escapeHtml(doc.date)}</td>
          <td class="center"><strong>${escapeHtml(emp.employeeId)}</strong></td>
          <td>${escapeHtml(emp.employeeName)}</td>
          <td class="center ${isPresent ? 'status-pass' : 'status-fail'}">${escapeHtml(emp.status)}</td>
          <td class="center">${escapeHtml(emp.time || '—')}</td>
          <td>${escapeHtml(doc.markedBy || 'dispatch.supervisor')}</td>
        </tr>
      `;
    }
  }

  if (records.length === 0) {
    tableRowsHtml = `<tr><td colspan="6" class="center">No attendance records found for selected date range.</td></tr>`;
  }

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Attendance Report</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 13px; }
        th { background-color: #1e293b; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; }
        td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
        .center { text-align: center; }
        .status-pass { color: #166534; font-weight: bold; }
        .status-fail { color: #991b1b; font-weight: bold; }
        h2 { font-family: Arial, sans-serif; color: #0f172a; margin-bottom: 4px; }
        p { font-family: Arial, sans-serif; color: #475569; font-size: 12px; margin-top: 0; margin-bottom: 12px; }
      </style>
    </head>
    <body>
      <h2>Refinishing Department - Employee Attendance Report</h2>
      <p>Date Range: ${startDate || 'All Dates'} to ${endDate || 'All Dates'} | Total Roster Documents: ${records.length}</p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Employee ID</th>
            <th>Employee Name</th>
            <th>Attendance Status</th>
            <th>Time Marked</th>
            <th>Supervisor</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

module.exports = {
  generateProductionCsv,
  generateProductionExcel,
  generateAttendanceCsv,
  generateAttendanceExcel
};
