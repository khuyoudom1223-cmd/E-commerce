// SleekCart Vendor Approval - Full API Test
// Run with: node test_vendor_approval.js

const BASE = 'http://localhost:5174';

async function api(method, path, body, token) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body)  opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json();
  return { ok: res.ok, status: res.status, data: json };
}

function pass(msg) { console.log(`  \x1b[32m[PASS]\x1b[0m ${msg}`); }
function fail(msg) { console.log(`  \x1b[31m[FAIL]\x1b[0m ${msg}`); }
function info(msg) { console.log(`  \x1b[33m[INFO]\x1b[0m ${msg}`); }
function head(msg) { console.log(`\n\x1b[36m[ ${msg} ]\x1b[0m`); }

async function runTests() {
  console.log('\n\x1b[35m============================================================');
  console.log('   SLEEKCART - FULL VENDOR APPROVAL SYSTEM TEST');
  console.log('============================================================\x1b[0m');

  // ── INIT: Trigger re-seed ──────────────────────────────────────────────────
  head('INIT: Triggering server re-seed');
  const ping = await api('GET', '/api/products');
  if (ping.ok) pass(`Server healthy. ${ping.data.length} products available.`);
  else fail('Server not responding');

  // ── PHASE 1: Register new Vendor ──────────────────────────────────────────
  head('PHASE 1: Register new Vendor account');
  let vendorToken = null;
  const regResp = await api('POST', '/api/auth/register', {
    name: 'Sokha Fresh Merchant',
    email: 'sokha.fresh3@test.com',
    phone: '+855 12 000 111',
    password: 'password',
    role: 'vendor'
  });

  if (regResp.ok) {
    vendorToken = regResp.data.token;
    pass(`Registered: ${regResp.data.user.name} <${regResp.data.user.email}> (${regResp.data.user.role})`);
  } else {
    info('Email exists — logging in as existing vendor');
    const logResp = await api('POST', '/api/auth/login', { email: 'sokha.fresh3@test.com', password: 'password' });
    vendorToken = logResp.data.token;
    if (vendorToken) pass(`Logged in as: ${logResp.data.user.role}`);
    else { fail('Cannot authenticate vendor'); process.exit(1); }
  }

  // ── PHASE 2: Check Vendor Dashboard — must be PENDING ─────────────────────
  head('PHASE 2: Check Vendor Dashboard status (expect: PENDING)');
  const dashResp = await api('GET', '/api/vendor/dashboard', null, vendorToken);
  let vendorId = null;

  if (dashResp.ok && dashResp.data.vendor) {
    const v = dashResp.data.vendor;
    vendorId = v.id;
    pass(`Dashboard fetched. Store: "${v.storeName}" (id: ${v.id})`);
    if (v.status === 'pending') {
      pass(`Status = PENDING => Lock screen "Application Under Audit" will render`);
    } else if (v.status === 'active') {
      fail(`Status = ACTIVE (should be 'pending' for fresh registration!)`);
    } else {
      fail(`Unexpected status: "${v.status}"`);
    }
  } else {
    fail(`Dashboard error: ${JSON.stringify(dashResp.data)}`);
    process.exit(1);
  }

  // ── PHASE 3: Admin Login ───────────────────────────────────────────────────
  head('PHASE 3: Admin Authentication');
  const adminResp = await api('POST', '/api/auth/login', { email: 'admin@sleekcart.com', password: 'admin' });
  let adminToken = null;

  if (adminResp.ok) {
    adminToken = adminResp.data.token;
    pass(`Admin logged in. Role: ${adminResp.data.user.role}`);
  } else {
    fail('Admin login failed'); process.exit(1);
  }

  // ── PHASE 4: Admin views applications ─────────────────────────────────────
  head('PHASE 4: Admin views all vendor applications');
  const vendorList = await api('GET', '/api/admin/vendors', null, adminToken);

  if (vendorList.ok) {
    const all     = vendorList.data;
    const pending = all.filter(v => v.status === 'pending');
    const active  = all.filter(v => v.status === 'active');
    pass(`${all.length} total stores — ${active.length} active, ${pending.length} pending`);
    pending.forEach(v => info(`  PENDING: "${v.storeName}" — ${v.ownerName} (${v.ownerEmail})`));
  } else {
    fail('Failed to fetch vendor list');
  }

  // ── PHASE 5: Admin Approves the new vendor ─────────────────────────────────
  head(`PHASE 5: Admin approves Sokha's store (id: ${vendorId})`);
  const approveResp = await api('POST', `/api/admin/vendors/${vendorId}/status`, { status: 'active' }, adminToken);

  if (approveResp.ok) {
    pass(approveResp.data.message);
    pass(`New status: ${approveResp.data.vendor.status}`);
  } else {
    fail(`Approval failed: ${JSON.stringify(approveResp.data)}`);
  }

  // ── PHASE 6: Vendor re-checks dashboard — must be ACTIVE ──────────────────
  head('PHASE 6: Vendor re-fetches dashboard (expect: ACTIVE / UNLOCKED)');
  const dash2 = await api('GET', '/api/vendor/dashboard', null, vendorToken);

  if (dash2.ok && dash2.data.vendor) {
    const newStatus = dash2.data.vendor.status;
    if (newStatus === 'active') {
      pass(`Status = ACTIVE => Vendor Storefront Portal is NOW FULLY UNLOCKED!`);
    } else if (newStatus === 'pending') {
      fail('Still PENDING — approval did not persist to disk');
    } else {
      fail(`Unexpected status: "${newStatus}"`);
    }
  } else {
    fail(`Re-fetch error: ${JSON.stringify(dash2.data)}`);
  }

  console.log('\n\x1b[35m============================================================');
  console.log('                 ALL TESTS COMPLETE');
  console.log('============================================================\x1b[0m\n');
}

runTests().catch(err => { console.error('Test error:', err); process.exit(1); });
