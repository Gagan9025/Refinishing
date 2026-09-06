const http = require('http');

function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runVerificationTests() {
  console.log('====================================================');
  console.log(' Starting Automated System Verification Tests (Dispatch Dashboard Removed)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Test Logins
    console.log('--- 1. Testing Demo Logins ---');
    const scanLogin = await makeRequest('/api/auth/login', 'POST', { username: 'scan.supervisor', password: 'Scan@123' });
    assert(scanLogin.status === 200 && scanLogin.body.token, 'Scanning supervisor login successful');

    const batchLogin = await makeRequest('/api/auth/login', 'POST', { username: 'batch.supervisor', password: 'Batch@123' });
    assert(batchLogin.status === 200 && batchLogin.body.token, 'Batch supervisor login successful');

    const dispatchLogin = await makeRequest('/api/auth/login', 'POST', { username: 'dispatch.supervisor', password: 'Dispatch@123' });
    assert(dispatchLogin.status === 200 && dispatchLogin.body.token && dispatchLogin.body.redirectUrl.includes('attendance'), 'Dispatch supervisor login redirects to Attendance page');

    const hodLogin = await makeRequest('/api/auth/login', 'POST', { username: 'hod', password: 'HOD@123' });
    assert(hodLogin.status === 200 && hodLogin.body.token, 'HOD login successful');

    const adminLogin = await makeRequest('/api/auth/login', 'POST', { username: 'admin', password: 'Admin@123' });
    assert(adminLogin.status === 200 && adminLogin.body.token, 'Admin login successful');

    const scanToken = scanLogin.body.token;
    const dispatchToken = dispatchLogin.body.token;
    const adminToken = adminLogin.body.token;
    const hodToken = hodLogin.body.token;

    // 2. Test RBAC Enforcement
    console.log('\n--- 2. Testing Role-Based Access Control (RBAC) ---');
    const scanAllowed = await makeRequest('/api/scanning/data', 'GET', null, scanToken);
    assert(scanAllowed.status === 200, 'Scanning supervisor can access scanning data');

    const scanBlockedBatch = await makeRequest('/api/batch/data', 'GET', null, scanToken);
    assert(scanBlockedBatch.status === 403, 'Scanning supervisor BLOCKED from accessing batch data (403)');

    const scanBlockedAdmin = await makeRequest('/api/admin/users', 'GET', null, scanToken);
    assert(scanBlockedAdmin.status === 403, 'Scanning supervisor BLOCKED from accessing admin endpoint (403)');

    // 3. Test Scanning Production & Reset
    console.log('\n--- 3. Testing Scanning Production & Reset ---');
    const todayStr = new Date().toISOString().split('T')[0];
    const targetRes = await makeRequest('/api/scanning/target', 'POST', { date: todayStr, dailyTarget: 800 }, scanToken);
    assert(targetRes.status === 200 && targetRes.body.data.dailyTarget === 800, 'Daily target set to 800 pieces');

    const resetScan = await makeRequest('/api/scanning/reset', 'POST', { date: todayStr }, scanToken);
    assert(resetScan.status === 200 && resetScan.body.data.dailyTarget === 0, 'Scanning data reset back to 0 target');

    // 4. Test Attendance Management
    console.log('\n--- 4. Testing Attendance Module ---');
    const attRes = await makeRequest('/api/attendance?date=' + todayStr, 'GET', null, dispatchToken);
    assert(attRes.status === 200 && attRes.body.data.totalEmployees >= 50, 'Attendance roster loaded employees list');

    // 5. Test HOD Overview
    console.log('\n--- 5. Testing HOD Executive Overview ---');
    const hodOverview = await makeRequest('/api/hod/overview?date=' + todayStr, 'GET', null, hodToken);
    assert(hodOverview.status === 200 && hodOverview.body.summary.scanning && hodOverview.body.summary.batch, 'HOD Overview retrieved aggregated metrics for Scanning & Batch');

    // 6. Test Admin User Management
    console.log('\n--- 6. Testing Admin User Management ---');
    const usersList = await makeRequest('/api/admin/users', 'GET', null, adminToken);
    assert(usersList.status === 200 && usersList.body.users.length >= 5, 'Admin fetched all system user accounts');

    // 7. Test Attendance CSV Export
    console.log('\n--- 7. Testing CSV Export Engine ---');
    const exportRes = await makeRequest('/api/export/download?module=attendance&startDate=' + todayStr + '&endDate=' + todayStr, 'GET', null, dispatchToken);
    assert(exportRes.status === 200 && typeof exportRes.body === 'string' && exportRes.body.includes('Employee ID'), 'Attendance CSV export generated valid report');

    console.log('\n====================================================');
    console.log(` Verification Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runVerificationTests();
