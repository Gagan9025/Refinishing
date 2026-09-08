/* Scanning Production Module JS */

let currentData = null;
let selectedDate = typeof getLocalDateString === 'function' ? getLocalDateString() : new Date().toISOString().split('T')[0];

const WORKING_SLOTS = [
  { slotId: 'slot_1', time: '8:30 AM – 9:30 AM', isLunch: false },
  { slotId: 'slot_2', time: '9:30 AM – 10:30 AM', isLunch: false },
  { slotId: 'slot_3', time: '10:30 AM – 11:30 AM', isLunch: false },
  { slotId: 'slot_4', time: '11:30 AM – 12:30 PM', isLunch: false },
  { slotId: 'slot_lunch', time: '12:30 PM – 1:00 PM', isLunch: true },
  { slotId: 'slot_5', time: '1:00 PM – 2:00 PM', isLunch: false },
  { slotId: 'slot_6', time: '2:00 PM – 3:00 PM', isLunch: false },
  { slotId: 'slot_7', time: '3:00 PM – 4:00 PM', isLunch: false },
  { slotId: 'slot_8', time: '4:00 PM – 5:00 PM', isLunch: false }
];

function setQuickDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const dateStr = typeof getLocalDateString === 'function' ? getLocalDateString(d) : d.toISOString().split('T')[0];
  const inputEl = document.getElementById('target-date');
  if (inputEl) {
    inputEl.value = dateStr;
  }
  loadScanningDashboard();
}

async function loadScanningDashboard() {
  const dateInput = document.getElementById('target-date');
  if (dateInput && dateInput.value) {
    selectedDate = dateInput.value;
  }

  try {
    const res = await API.request(`/api/scanning/data?date=${selectedDate}`);
    currentData = res.data;
    renderScanningDashboard();
  } catch (err) {
    showToast(err.message || 'Error loading scanning data', 'error');
  }
}

function renderScanningDashboard() {
  if (!currentData) return;

  const targetDisplay = document.getElementById('target-display-section');
  const targetForm = document.getElementById('target-form-section');
  const dailyTargetValue = document.getElementById('daily-target-value');

  if (currentData.dailyTarget && currentData.dailyTarget > 0) {
    targetDisplay.style.display = 'flex';
    targetForm.style.display = 'none';
    if (dailyTargetValue) {
      dailyTargetValue.textContent = `${currentData.dailyTarget} Pieces`;
    }
  } else {
    targetDisplay.style.display = 'none';
    targetForm.style.display = 'block';
  }

  const dailyTarget = currentData.dailyTarget || 0;
  const totalAchieved = currentData.totalAchieved || 0;
  const pending = currentData.pending || 0;
  const achievementPct = currentData.achievementPercentage || 0;

  document.getElementById('metric-daily-target').textContent = dailyTarget;
  document.getElementById('metric-total-achieved').textContent = totalAchieved;
  
  const pendingEl = document.getElementById('metric-pending');
  const pendingSubEl = document.getElementById('metric-pending-sub');
  
  if (totalAchieved > dailyTarget && dailyTarget > 0) {
    const exceededCount = totalAchieved - dailyTarget;
    pendingEl.textContent = '0';
    pendingSubEl.textContent = `Target exceeded by ${exceededCount} pieces`;
    pendingSubEl.className = 'metric-sub text-diff-positive';
  } else {
    pendingEl.textContent = pending;
    pendingSubEl.textContent = 'Remaining to reach daily target';
    pendingSubEl.className = 'metric-sub';
  }

  const pctEl = document.getElementById('metric-achievement-pct');
  pctEl.textContent = `${achievementPct}%`;

  const fillEl = document.getElementById('achievement-progress-fill');
  if (fillEl) {
    fillEl.style.width = `${Math.min(100, achievementPct)}%`;
    if (achievementPct >= 100) fillEl.className = 'progress-bar-fill success';
    else if (achievementPct >= 80) fillEl.className = 'progress-bar-fill warning';
    else fillEl.className = 'progress-bar-fill danger';
  }

  // Day Status Banner
  const statusBanner = document.getElementById('day-status-banner');
  if (statusBanner) {
    if (dailyTarget === 0) {
      statusBanner.textContent = 'TARGET NOT SET (0)';
      statusBanner.className = 'badge badge-danger';
    } else {
      statusBanner.textContent = getDayStatusMessage(selectedDate);
      statusBanner.className = 'badge badge-info';
    }
  }

  renderHourlyTable();
}

function renderHourlyTable() {
  const tbody = document.getElementById('scanning-table-body');
  if (!tbody) return;

  const hourlyTarget = currentData.hourlyTarget || 0;
  const hourlyData = currentData.hourlyData || {};

  tbody.innerHTML = WORKING_SLOTS.map(slot => {
    if (slot.isLunch) {
      return `
        <tr class="lunch-row">
          <td><strong>${slot.time}</strong></td>
          <td>—</td>
          <td>—</td>
          <td>—</td>
          <td>—</td>
          <td><span class="badge badge-lunch">LUNCH BREAK</span></td>
          <td><span class="badge badge-secondary">DISABLED</span></td>
        </tr>
      `;
    }

    const slotStatus = getSlotStatus(slot, selectedDate);
    const achievedVal = hourlyData[slot.slotId];
    const isEntered = achievedVal !== undefined && achievedVal !== null;
    const achievedNum = isEntered ? parseInt(achievedVal, 10) : 0;

    let diffText = '—';
    let achPctText = '—';
    let statusBadge = `<span class="badge badge-secondary">${slotStatus}</span>`;

    if (slotStatus === 'CURRENT HOUR') {
      statusBadge = `<span class="badge badge-info">CURRENT HOUR</span>`;
    }

    if (isEntered && hourlyTarget > 0) {
      const diff = achievedNum - hourlyTarget;
      diffText = diff >= 0 ? `<span class="text-diff-positive">+${diff}</span>` : `<span class="text-diff-negative">${diff}</span>`;
      const pct = Number(((achievedNum / hourlyTarget) * 100).toFixed(1));
      achPctText = `${pct}%`;

      if (diff < 0) {
        statusBadge = `<span class="badge badge-danger">Below Target</span>`;
      } else if (diff === 0) {
        statusBadge = `<span class="badge badge-success">Achieved Target</span>`;
      } else {
        statusBadge = `<span class="badge badge-success">Exceeded</span>`;
      }
    }

    const isCurrentHourRow = slotStatus === 'CURRENT HOUR';

    return `
      <tr class="${isCurrentHourRow ? 'current-hour-row' : ''}">
        <td><strong>${slot.time}</strong></td>
        <td><strong>${hourlyTarget}</strong></td>
        <td>
          <input type="number" min="0" class="form-input" style="width: 100px; text-align: center;"
            id="input-${slot.slotId}" 
            value="${isEntered ? achievedVal : ''}" 
            placeholder="0"
            ${currentData.dailyTarget <= 0 ? 'disabled' : ''} />
        </td>
        <td>${diffText}</td>
        <td><strong>${achPctText}</strong></td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="saveHourlyEntry('${slot.slotId}')" ${currentData.dailyTarget <= 0 ? 'disabled' : ''}>
            Save
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function saveTarget() {
  const dateVal = document.getElementById('target-date').value;
  const targetVal = document.getElementById('input-daily-target').value;

  if (!dateVal) {
    showToast('Please select a valid date', 'warning');
    return;
  }

  if (!targetVal || parseInt(targetVal, 10) <= 0) {
    showToast('Please enter a valid daily target greater than 0', 'warning');
    return;
  }

  selectedDate = dateVal;
  const btn = document.getElementById('btn-save-target');
  if (btn) btn.disabled = true;

  try {
    const res = await API.request('/api/scanning/target', {
      method: 'POST',
      body: JSON.stringify({ date: dateVal, dailyTarget: targetVal })
    });

    showToast('Daily target saved successfully!', 'success');
    currentData = res.data;
    renderScanningDashboard();
  } catch (err) {
    showToast(err.message || 'Failed to save daily target', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function enableEditTarget() {
  document.getElementById('target-display-section').style.display = 'none';
  const formSection = document.getElementById('target-form-section');
  formSection.style.display = 'block';
  document.getElementById('input-daily-target').value = currentData.dailyTarget || '';
}

async function saveHourlyEntry(slotId) {
  const inputEl = document.getElementById(`input-${slotId}`);
  if (!inputEl) return;

  const value = inputEl.value;
  if (value === '' || parseInt(value, 10) < 0) {
    showToast('Please enter a valid quantity (0 or greater)', 'warning');
    return;
  }

  try {
    const res = await API.request('/api/scanning/hourly', {
      method: 'POST',
      body: JSON.stringify({
        date: selectedDate,
        slotId: slotId,
        achieved: parseInt(value, 10)
      })
    });

    showToast('Hourly production saved successfully.', 'success');
    currentData = res.data;
    renderScanningDashboard();
  } catch (err) {
    showToast(err.message || 'Failed to save hourly entry', 'error');
  }
}

async function resetScanningData() {
  if (!confirm(`Are you sure you want to reset all Scanning production data to 0 for ${selectedDate}?`)) return;

  try {
    const res = await API.request('/api/scanning/reset', {
      method: 'POST',
      body: JSON.stringify({ date: selectedDate })
    });
    showToast(`Scanning production data reset to 0 for ${selectedDate}`, 'success');
    currentData = res.data;
    renderScanningDashboard();
  } catch (err) {
    showToast(err.message || 'Failed to reset scanning data', 'error');
  }
}

function triggerExport(format) {
  const url = `/api/export/download?module=scanning&startDate=${selectedDate}&endDate=${selectedDate}&format=${format}`;
  window.open(url, '_blank');
}
