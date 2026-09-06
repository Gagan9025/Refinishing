/* HOD Dashboard & Analytics Module JS */

let currentOverview = null;
let currentSupervisorData = null;

async function loadHodDashboard() {
  const rangeType = document.getElementById('hod-range-type').value;
  const singleDate = document.getElementById('hod-single-date').value;
  const customStart = document.getElementById('hod-start-date').value;
  const customEnd = document.getElementById('hod-end-date').value;

  const customRangeBox = document.getElementById('hod-custom-range-box');
  if (rangeType === 'custom') {
    customRangeBox.style.display = 'flex';
  } else {
    customRangeBox.style.display = 'none';
  }

  let query = `rangeType=${rangeType}&date=${singleDate}`;
  if (rangeType === 'custom' && customStart && customEnd) {
    query += `&startDate=${customStart}&endDate=${customEnd}`;
  }

  try {
    const res = await API.request(`/api/hod/overview?${query}`);
    currentOverview = res.summary;
    renderHodOverview();
    loadHodComparison();
    loadSupervisorView();
  } catch (err) {
    showToast(err.message || 'Error loading HOD dashboard', 'error');
  }
}

function renderHodOverview() {
  if (!currentOverview) return;

  const { scanning, batch, attendance } = currentOverview;

  // Scanning Card
  document.getElementById('hod-scan-target').textContent = scanning.target;
  document.getElementById('hod-scan-achieved').textContent = scanning.achieved;
  document.getElementById('hod-scan-pct').textContent = `${scanning.achievementPercentage}%`;
  setBarWidth('hod-scan-bar', scanning.achievementPercentage);

  // Batch Card
  document.getElementById('hod-batch-target').textContent = batch.target;
  document.getElementById('hod-batch-achieved').textContent = batch.achieved;
  document.getElementById('hod-batch-pct').textContent = `${batch.achievementPercentage}%`;
  setBarWidth('hod-batch-bar', batch.achievementPercentage);

  // Attendance Card
  document.getElementById('hod-att-present').textContent = attendance.present;
  document.getElementById('hod-att-absent').textContent = attendance.absent;
  document.getElementById('hod-att-pct').textContent = `${attendance.attendancePercentage}%`;
  setBarWidth('hod-att-bar', attendance.attendancePercentage);
}

function setBarWidth(id, percentage) {
  const el = document.getElementById(id);
  if (el) {
    const pct = Math.min(100, Math.max(0, percentage));
    el.style.width = `${pct}%`;
    if (pct >= 90) el.className = 'progress-bar-fill success';
    else if (pct >= 75) el.className = 'progress-bar-fill warning';
    else el.className = 'progress-bar-fill danger';
  }
}

async function loadHodComparison() {
  const date = document.getElementById('hod-single-date').value;
  try {
    const res = await API.request(`/api/hod/comparison?date=${date}`);
    const tbody = document.getElementById('hod-comparison-table-body');
    if (!tbody) return;

    tbody.innerHTML = res.comparison.map(item => {
      const statusBadge = item.achievementPercentage >= 100 
        ? `<span class="badge badge-success">Target Exceeded</span>`
        : item.achievementPercentage >= 75 
          ? `<span class="badge badge-warning">On Track</span>`
          : `<span class="badge badge-danger">Below Target</span>`;

      return `
        <tr>
          <td><strong>${item.module}</strong></td>
          <td>${item.supervisor}</td>
          <td><strong>${item.target}</strong></td>
          <td><strong style="color: var(--color-primary);">${item.achieved}</strong></td>
          <td>${item.pending}</td>
          <td><strong>${item.achievementPercentage}%</strong></td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading HOD comparison:', err);
  }
}

async function loadSupervisorView() {
  const targetModule = document.getElementById('hod-supervisor-select').value;
  const date = document.getElementById('hod-single-date').value;

  try {
    const res = await API.request(`/api/hod/supervisor-view?module=${targetModule}&date=${date}`);
    currentSupervisorData = res.data;
    renderSupervisorDetailView(res.data, targetModule);
  } catch (err) {
    console.error('Error loading supervisor view:', err);
  }
}

function renderSupervisorDetailView(data, moduleName) {
  const container = document.getElementById('hod-supervisor-detail-container');
  if (!container) return;

  if (!data) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: #64748b;">
        No production records logged for <strong>${moduleName.toUpperCase()}</strong> on this date.
      </div>
    `;
    return;
  }

  // Scanning & Batch Hourly Detailed Table
  const hourlyTarget = data.hourlyTarget || 0;
  const hourlyData = data.hourlyData || {};

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

  container.innerHTML = `
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>Supervisor:</strong> ${data.supervisorName || data.supervisorId} | 
        <strong>Daily Target:</strong> ${data.dailyTarget || 0} | 
        <strong>Total Achieved:</strong> ${data.totalAchieved || 0} | 
        <strong>Achievement:</strong> ${data.achievementPercentage || 0}%
      </div>
    </div>
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Time Slot</th>
            <th>Hourly Target</th>
            <th>Achieved</th>
            <th>Difference</th>
            <th>Achievement %</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${WORKING_SLOTS.map(s => {
            if (s.isLunch) {
              return `<tr class="lunch-row"><td><strong>${s.time}</strong></td><td colspan="4">LUNCH BREAK</td><td><span class="badge badge-lunch">LUNCH</span></td></tr>`;
            }
            const val = hourlyData[s.slotId];
            const isEntered = val !== undefined && val !== null;
            const ach = isEntered ? parseInt(val, 10) : 0;
            const diff = isEntered ? ach - hourlyTarget : 0;
            const diffText = isEntered ? (diff >= 0 ? `+${diff}` : `${diff}`) : '—';
            const pctText = isEntered && hourlyTarget > 0 ? `${((ach / hourlyTarget) * 100).toFixed(1)}%` : '—';
            
            return `
              <tr>
                <td><strong>${s.time}</strong></td>
                <td>${hourlyTarget}</td>
                <td><strong>${isEntered ? val : '—'}</strong></td>
                <td>${diffText}</td>
                <td>${pctText}</td>
                <td>${isEntered ? (diff >= 0 ? '<span class="badge badge-success">Achieved</span>' : '<span class="badge badge-danger">Below</span>') : '<span class="badge badge-secondary">Pending</span>'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function exportHodReport() {
  const mod = document.getElementById('hod-supervisor-select').value;
  const date = document.getElementById('hod-single-date').value;
  window.open(`/api/export/download?module=${mod}&startDate=${date}&endDate=${date}`, '_blank');
}
