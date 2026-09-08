let currentTimeframe = 'monthly';

document.addEventListener('DOMContentLoaded', async () => {
  // Check auth user
  const user = API.getUser ? API.getUser() : getAuthUser();
  if (!user) {
    window.location.href = '/index.html';
    return;
  }

  // Initialize common header, mobile menu, and dynamic sidebar
  if (typeof initHeaderAndSidebar === 'function') {
    initHeaderAndSidebar('revenue-dashboard');
  }

  // Set user role badge if present
  const roleBadge = document.getElementById('sidebar-role');
  if (roleBadge) {
    roleBadge.innerText = (user.role || 'user').toUpperCase().replace('_', ' ');
  }

  // Load initial revenue data
  await loadRevenueAnalytics('monthly');
});

async function setTimeframe(tf, element) {
  currentTimeframe = tf;
  
  // Highlight active button
  document.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));
  if (element) {
    element.classList.add('active');
  }

  await loadRevenueAnalytics(tf);
}

async function loadRevenueAnalytics(timeframe = 'monthly') {
  const tbody = document.getElementById('analytics-table-body');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 25px;">Loading ${timeframe} performance data...</td></tr>`;
  }

  try {
    const response = await fetchWithAuth(`/api/analytics/revenue-production?timeframe=${timeframe}`);
    if (!response || !response.ok) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: red; padding: 20px;">Failed to load analytics data.</td></tr>`;
      return;
    }

    const resData = await response.json();
    const { summary, data } = resData;

    // Update KPI Cards
    updateKpiCards(timeframe, summary, data);

    // Update Table Title
    const tableTitle = document.getElementById('table-title');
    if (tableTitle) {
      tableTitle.innerText = `${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Revenue & Target Performance Breakdown`;
    }

    // Render Table Rows
    renderTableRows(data);
  } catch (err) {
    console.error('Error loading revenue analytics:', err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: red; padding: 20px;">Server error while loading data.</td></tr>`;
  }
}

function updateKpiCards(timeframe, summary, dataList) {
  const kpiTargetVal = document.getElementById('kpi-target-display');
  const kpiTargetSub = document.getElementById('kpi-target-sub');
  const kpiProdVal = document.getElementById('kpi-production-display');
  const kpiProdSub = document.getElementById('kpi-production-sub');
  const kpiRevVal = document.getElementById('kpi-revenue-display');
  const kpiRateVal = document.getElementById('kpi-rate-display');

  if (timeframe === 'daily') {
    if (kpiTargetVal) kpiTargetVal.innerText = '8,000 / day';
    if (kpiTargetSub) kpiTargetSub.innerText = 'Mon - Sat (Excl. Sundays)';
  } else if (timeframe === 'weekly') {
    if (kpiTargetVal) kpiTargetVal.innerText = '48,000 / week';
    if (kpiTargetSub) kpiTargetSub.innerText = '6 Working Days / Week';
  } else {
    if (kpiTargetVal) kpiTargetVal.innerText = '208,000 / month';
    if (kpiTargetSub) kpiTargetSub.innerText = '26 Working Days / Month';
  }

  // Calculate totals from current timeframe list
  const totalUnits = dataList.reduce((acc, item) => acc + item.actualProduction, 0);
  const totalRevenue = dataList.reduce((acc, item) => acc + item.revenue, 0);
  const totalTarget = dataList.reduce((acc, item) => acc + item.target, 0);

  if (kpiProdVal) kpiProdVal.innerText = `${totalUnits.toLocaleString('en-IN')} units`;
  if (kpiProdSub) kpiProdSub.innerText = `Across ${dataList.length} ${timeframe} period(s)`;

  if (kpiRevVal) kpiRevVal.innerText = `₹${totalRevenue.toLocaleString('en-IN')}`;

  const overallRate = totalTarget > 0 ? ((totalUnits / totalTarget) * 100).toFixed(1) : '0.0';
  if (kpiRateVal) kpiRateVal.innerText = `${overallRate}%`;
}

function renderTableRows(dataList) {
  const tbody = document.getElementById('analytics-table-body');
  if (!tbody) return;

  if (!dataList || dataList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 25px;">No production records found for this period.</td></tr>`;
    return;
  }

  let html = '';
  // Reverse order so newest periods are at the top
  const sorted = [...dataList].reverse();

  sorted.forEach(row => {
    const isAchieved = row.status === 'ACHIEVED';
    const badgeClass = isAchieved ? 'badge-success' : 'badge-warning';

    html += `
      <tr>
        <td style="font-weight: 600;">${row.label}</td>
        <td>${row.workingDays || 1} day(s)</td>
        <td><strong>${(row.target || 0).toLocaleString('en-IN')}</strong></td>
        <td>${(row.scanTotal || 0).toLocaleString('en-IN')}</td>
        <td>${(row.batchTotal || 0).toLocaleString('en-IN')}</td>
        <td style="font-weight: 700; color: #0284c7;">${(row.actualProduction || 0).toLocaleString('en-IN')}</td>
        <td>₹${row.unitPrice || 150}</td>
        <td style="font-weight: 700; color: #16a34a;">₹${(row.revenue || 0).toLocaleString('en-IN')}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>${row.completionRate}%</span>
            <div style="flex: 1; height: 6px; background: rgba(226, 232, 240, 0.6); border-radius: 4px; overflow: hidden; min-width: 60px;">
              <div style="width: ${Math.min(row.completionRate, 100)}%; height: 100%; background: ${isAchieved ? '#16a34a' : '#0284c7'};"></div>
            </div>
          </div>
        </td>
        <td><span class="badge ${badgeClass}">${row.status}</span></td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function triggerRevenueExport() {
  window.open(`/api/export/overview?rangeType=${currentTimeframe}`, '_blank');
}
