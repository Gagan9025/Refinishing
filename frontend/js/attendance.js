/* Employee Attendance Module JS */

let currentAttendance = null;
let selectedDate = new Date().toISOString().split('T')[0];

async function loadAttendanceData() {
  const dateInput = document.getElementById('attendance-date');
  if (dateInput) {
    selectedDate = dateInput.value || selectedDate;
  }

  try {
    const res = await API.request(`/api/attendance?date=${selectedDate}`);
    currentAttendance = res.data;
    renderAttendanceDashboard();
  } catch (err) {
    showToast(err.message || 'Error loading attendance data', 'error');
  }
}

function renderAttendanceDashboard() {
  if (!currentAttendance) return;

  const total = currentAttendance.totalEmployees || 0;
  const present = currentAttendance.presentCount || 0;
  const absent = currentAttendance.absentCount || 0;
  const pct = currentAttendance.attendancePercentage || 0;

  document.getElementById('metric-total-emp').textContent = total;
  document.getElementById('metric-present-emp').textContent = present;
  document.getElementById('metric-absent-emp').textContent = absent;
  document.getElementById('metric-attendance-pct').textContent = `${pct}%`;

  const fillEl = document.getElementById('attendance-progress-fill');
  if (fillEl) {
    fillEl.style.width = `${Math.min(100, pct)}%`;
    if (pct >= 90) fillEl.className = 'progress-bar-fill success';
    else if (pct >= 75) fillEl.className = 'progress-bar-fill warning';
    else fillEl.className = 'progress-bar-fill danger';
  }

  renderAttendanceTable();
}

function renderAttendanceTable() {
  const tbody = document.getElementById('attendance-table-body');
  if (!tbody) return;

  const records = currentAttendance.records || [];
  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No employees recorded for ${selectedDate}. Click "Add Employee" to initialize roster.</td></tr>`;
    return;
  }

  tbody.innerHTML = records.map(emp => {
    const isPresent = emp.status === 'Present';
    return `
      <tr>
        <td><strong>${emp.employeeId}</strong></td>
        <td>${emp.employeeName}</td>
        <td>
          <span class="badge ${isPresent ? 'badge-success' : 'badge-danger'}">
            ${emp.status}
          </span>
        </td>
        <td><strong>${emp.time || '—'}</strong></td>
        <td>
          <button class="btn btn-sm ${isPresent ? 'btn-secondary' : 'btn-success'}" onclick="toggleEmployeeStatus('${emp.employeeId}', '${isPresent ? 'Absent' : 'Present'}')">
            Mark ${isPresent ? 'Absent' : 'Present'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function toggleEmployeeStatus(employeeId, newStatus) {
  try {
    const res = await API.request('/api/attendance/status', {
      method: 'POST',
      body: JSON.stringify({
        date: selectedDate,
        employeeId,
        status: newStatus
      })
    });

    currentAttendance = res.data;
    renderAttendanceDashboard();
    showToast(`Employee ${employeeId} marked as ${newStatus}`, 'success');
  } catch (err) {
    showToast(err.message || 'Failed to update attendance status', 'error');
  }
}

async function handleAddEmployee(e) {
  e.preventDefault();
  const empId = document.getElementById('new-emp-id').value.trim();
  const empName = document.getElementById('new-emp-name').value.trim();
  const status = document.getElementById('new-emp-status').value;

  if (!empId || !empName) {
    showToast('Employee ID and Name are required.', 'warning');
    return;
  }

  try {
    const res = await API.request('/api/attendance/employee', {
      method: 'POST',
      body: JSON.stringify({
        date: selectedDate,
        employeeId: empId,
        employeeName: empName,
        status
      })
    });

    showToast(`Employee ${empName} added successfully.`, 'success');
    closeAddModal();
    currentAttendance = res.data;
    renderAttendanceDashboard();
  } catch (err) {
    showToast(err.message || 'Failed to add employee', 'error');
  }
}

async function resetAttendanceData() {
  if (!confirm(`Are you sure you want to reset all Attendance records to 0 Present for ${selectedDate}?`)) return;

  try {
    const res = await API.request('/api/attendance/reset', {
      method: 'POST',
      body: JSON.stringify({ date: selectedDate })
    });
    showToast(`Attendance reset to 0 Present for ${selectedDate}`, 'success');
    currentAttendance = res.data;
    renderAttendanceDashboard();
  } catch (err) {
    showToast(err.message || 'Failed to reset attendance data', 'error');
  }
}

function openAddModal() {
  document.getElementById('add-emp-modal').classList.add('active');
}

function closeAddModal() {
  document.getElementById('add-emp-modal').classList.remove('active');
  document.getElementById('add-emp-form').reset();
}

function triggerExportAttendance() {
  window.open(`/api/export/download?module=attendance&startDate=${selectedDate}&endDate=${selectedDate}`, '_blank');
}
