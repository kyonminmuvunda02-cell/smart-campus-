# Smart Campus CUZ — Special Screens

Detailed patterns for QR scan flow, GPS verification, Digital ID card, Roles & Permissions (RBAC), and auth screens.

---

## QR Code Scan Flow

### Student side — "Scan In" modal

Triggered by: "Scan Attendance" button on dashboard or digital ID page.

```html
<div class="modal-overlay open" id="scanModal">
  <div class="modal-box">
    <div class="modal-hd">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="ph-icon" style="width:32px;height:32px;border-radius:8px">
          <i class="ti ti-qrcode" style="font-size:16px"></i>
        </div>
        <span class="modal-title">Scan Attendance — CS301</span>
      </div>
      <button class="act-ico" onclick="closeModal()">
        <i class="ti ti-x" style="font-size:14px"></i>
      </button>
    </div>
    <div class="modal-body">
      <!-- Info callout -->
      <div class="callout callout-info" style="margin-bottom:16px">
        <i class="ti ti-info-circle" style="color:var(--royal)"></i>
        <div>
          <div class="callout-title" style="color:var(--royal)">QR Code Valid for 30 seconds</div>
          <div class="callout-msg" style="color:var(--tx2)">This code refreshes automatically. GPS must be within 50m of campus.</div>
        </div>
      </div>
      <!-- QR display -->
      <div style="text-align:center;padding:20px 0">
        <div style="width:130px;height:130px;background:var(--royal);border-radius:16px;display:inline-grid;place-items:center;margin-bottom:14px">
          <i class="ti ti-qrcode" style="font-size:72px;color:#fff"></i>
        </div>
        <!-- Countdown timer -->
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px">
          <div class="prog-bar" style="width:160px;height:4px">
            <div class="prog-fill" id="qrTimer" style="width:80%;background:var(--accent);transition:width 1s linear"></div>
          </div>
          <span class="mono" style="font-size:11px;color:var(--tx4)" id="qrCountdown">24s</span>
        </div>
        <div class="mono" style="font-size:15px;font-weight:700;color:var(--tx1);letter-spacing:3px">103 · 497</div>
        <div style="font-size:12px;color:var(--tx4);margin-top:4px">Mbozu Mutanga · Computer Science</div>
      </div>
      <!-- GPS widget -->
      <div class="gps-widget">
        <div class="gps-map-mock">
          <div class="gps-grid"></div>
          <div class="gps-ring"></div>
          <div class="gps-dot"></div>
        </div>
        <div class="gps-label-row">
          <div class="gps-status">On Campus · Verified</div>
          <div class="gps-coords">-15.4166, 28.2827</div>
        </div>
      </div>
    </div>
    <div class="modal-ft">
      <button class="btn btn-outline btn-sm" onclick="closeModal()"><i class="ti ti-x"></i>Cancel</button>
      <button class="btn btn-green btn-sm"><i class="ti ti-check"></i>Confirm Attendance</button>
    </div>
  </div>
</div>
```

QR countdown JS:
```js
let qrSeconds = 30;
const timerEl = document.getElementById('qrCountdown');
const barEl   = document.getElementById('qrTimer');
const qrInterval = setInterval(() => {
  qrSeconds--;
  if (timerEl) timerEl.textContent = qrSeconds + 's';
  if (barEl)   barEl.style.width = (qrSeconds / 30 * 100) + '%';
  if (qrSeconds <= 0) {
    qrSeconds = 30; // refresh QR
  }
}, 1000);
```

---

### Attendance Confirmed state (post-scan)

```html
<div style="text-align:center;padding:28px 20px">
  <div style="width:64px;height:64px;border-radius:50%;background:var(--green-lt);display:grid;place-items:center;margin:0 auto 16px;border:2px solid rgba(22,163,74,.2)">
    <i class="ti ti-circle-check" style="font-size:32px;color:var(--green)"></i>
  </div>
  <div style="font-size:17px;font-weight:800;color:var(--tx1);margin-bottom:4px">Attendance Confirmed!</div>
  <div style="font-size:13px;color:var(--tx4)">CS301 · Web Development</div>
  <div style="margin:14px 0">
    <span class="pill pill-teal"><i class="ti ti-map-pin"></i>GPS Verified</span>
    <span class="pill pill-green" style="margin-left:6px"><i class="ti ti-clock"></i>08:03 AM</span>
  </div>
  <div class="callout callout-success" style="text-align:left">
    <i class="ti ti-shield-check" style="color:var(--green)"></i>
    <div>
      <div class="callout-title" style="color:var(--green)">Proxy Attendance Prevented</div>
      <div class="callout-msg" style="color:var(--tx2)">Identity and GPS location verified. Record is tamper-proof.</div>
    </div>
  </div>
</div>
```

---

### GPS Fail state (off-campus)

```html
<div style="text-align:center;padding:28px 20px">
  <div style="width:64px;height:64px;border-radius:50%;background:var(--red-lt);display:grid;place-items:center;margin:0 auto 16px">
    <i class="ti ti-map-pin-off" style="font-size:32px;color:var(--red)"></i>
  </div>
  <div style="font-size:17px;font-weight:800;color:var(--tx1);margin-bottom:4px">GPS Verification Failed</div>
  <div style="font-size:13px;color:var(--tx4);margin-bottom:16px">You are not within the campus boundary.</div>
  <div class="callout callout-error" style="text-align:left">
    <i class="ti ti-alert-circle" style="color:var(--red)"></i>
    <div>
      <div class="callout-title" style="color:var(--red)">Outside 50m Campus Zone</div>
      <div class="callout-msg" style="color:var(--tx2)">Move to the campus area and try again. Attendance cannot be recorded remotely.</div>
    </div>
  </div>
</div>
```

---

## Digital ID Card — Full Page

Key points:
- Banner: `linear-gradient(135deg, #0F2347, #1B3F9A)` — dark navy to royal blue
- QR code icon placeholder: `<i class="ti ti-qrcode">` inside white box
- Footer: RBAC verified badge + validity year

HTML:
```html
<div class="id-card">
  <div class="id-card-banner">
    <div class="id-qr-area">
      <div style="width:80px;height:80px;background:var(--royal);border-radius:8px;display:grid;place-items:center">
        <i class="ti ti-qrcode" style="font-size:44px;color:#fff"></i>
      </div>
    </div>
    <div>
      <div style="font-size:14px;font-weight:800;color:#fff">MBOZU MUTANGA</div>
      <div style="font-size:11px;color:rgba(255,255,255,.65);margin-top:2px">Computer Science · Y3</div>
      <div style="margin-top:8px">
        <span class="pill" style="background:rgba(255,255,255,.15);color:#fff;font-size:10px">Active Student</span>
      </div>
    </div>
  </div>
  <div class="id-card-info">
    <div class="id-meta-row"><i class="ti ti-hash"></i><span class="mono">103-497</span></div>
    <div class="id-meta-row"><i class="ti ti-building"></i>School of Information Technology</div>
    <div class="id-meta-row"><i class="ti ti-calendar"></i>Enrolled: Feb 2023</div>
    <div class="id-meta-row"><i class="ti ti-mail"></i>m.mutanga@cuz.ac.zm</div>
  </div>
  <div class="id-card-footer">
    <div style="font-size:11px;color:var(--tx4)">
      <i class="ti ti-shield-check" style="color:var(--green);margin-right:4px"></i>RBAC Verified
    </div>
    <div class="mono" style="font-size:10px;color:var(--tx4)">Valid · 2025</div>
  </div>
</div>
```

---

## Roles & Permissions (RBAC)

### Page structure

1. Page header (purple gradient icon)
2. Role summary cards row (Student, Lecturer, Admin)
3. Permission matrix section
4. Individual role detail cards

### Role summary cards

```html
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
  <!-- Student role card -->
  <div class="card" style="border-top:3px solid var(--teal)">
    <div class="card-hd">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:34px;height:34px;border-radius:9px;background:var(--teal-lt);display:grid;place-items:center">
          <i class="ti ti-user" style="color:var(--teal)"></i>
        </div>
        <div>
          <div class="card-title">Student</div>
          <div style="font-size:11.5px;color:var(--tx4)">Default role</div>
        </div>
      </div>
      <span class="pill pill-teal" style="font-size:10px">487 users</span>
    </div>
    <div class="card-body">
      <div style="font-size:12.5px;color:var(--tx3);margin-bottom:12px">
        Can scan QR attendance, view own records, manage profile. Cannot edit other records.
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span class="pill pill-green" style="font-size:10px"><i class="ti ti-check"></i>Scan QR</span>
        <span class="pill pill-green" style="font-size:10px"><i class="ti ti-check"></i>View Attendance</span>
        <span class="pill pill-red" style="font-size:10px"><i class="ti ti-x"></i>Manage Users</span>
      </div>
    </div>
    <div style="padding:10px 18px;border-top:1px solid var(--card-bd);display:flex;justify-content:flex-end;gap:6px">
      <button class="btn btn-outline btn-xs"><i class="ti ti-eye"></i>View</button>
      <button class="btn btn-primary btn-xs"><i class="ti ti-edit"></i>Edit</button>
    </div>
  </div>

  <!-- Lecturer role card -->
  <div class="card" style="border-top:3px solid var(--royal)">
    <div class="card-hd">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:34px;height:34px;border-radius:9px;background:var(--royal-lt);display:grid;place-items:center">
          <i class="ti ti-user-star" style="color:var(--royal)"></i>
        </div>
        <div>
          <div class="card-title">Lecturer</div>
          <div style="font-size:11.5px;color:var(--tx4)">Instructor access</div>
        </div>
      </div>
      <span class="pill pill-royal" style="font-size:10px">34 users</span>
    </div>
    <div class="card-body">
      <div style="font-size:12.5px;color:var(--tx3);margin-bottom:12px">
        Can start sessions, manage attendance for own modules, view student records.
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span class="pill pill-green" style="font-size:10px"><i class="ti ti-check"></i>Start Sessions</span>
        <span class="pill pill-green" style="font-size:10px"><i class="ti ti-check"></i>Mark Attendance</span>
        <span class="pill pill-amber" style="font-size:10px"><i class="ti ti-dots"></i>Limited Admin</span>
      </div>
    </div>
    <div style="padding:10px 18px;border-top:1px solid var(--card-bd);display:flex;justify-content:flex-end;gap:6px">
      <button class="btn btn-outline btn-xs"><i class="ti ti-eye"></i>View</button>
      <button class="btn btn-primary btn-xs"><i class="ti ti-edit"></i>Edit</button>
    </div>
  </div>

  <!-- Admin role card -->
  <div class="card" style="border-top:3px solid var(--purple)">
    <div class="card-hd">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:34px;height:34px;border-radius:9px;background:var(--purple-lt);display:grid;place-items:center">
          <i class="ti ti-shield" style="color:var(--purple)"></i>
        </div>
        <div>
          <div class="card-title">Administrator</div>
          <div style="font-size:11.5px;color:var(--tx4)">Full access</div>
        </div>
      </div>
      <span class="pill pill-purple" style="font-size:10px">5 users</span>
    </div>
    <div class="card-body">
      <div style="font-size:12.5px;color:var(--tx3);margin-bottom:12px">
        Full system access: manage users, roles, modules, reports, and system settings.
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span class="pill pill-green" style="font-size:10px"><i class="ti ti-check"></i>All Permissions</span>
        <span class="pill pill-purple" style="font-size:10px"><i class="ti ti-shield"></i>RBAC Control</span>
      </div>
    </div>
    <div style="padding:10px 18px;border-top:1px solid var(--card-bd);display:flex;justify-content:flex-end;gap:6px">
      <button class="btn btn-outline btn-xs"><i class="ti ti-eye"></i>View</button>
      <button class="btn btn-primary btn-xs"><i class="ti ti-edit"></i>Edit</button>
    </div>
  </div>
</div>
```

---

### Permission Matrix Table

```html
<div class="card">
  <div class="card-hd">
    <div class="card-title"><i class="ti ti-table" style="margin-right:6px;color:var(--royal)"></i>Permission Matrix</div>
    <div style="display:flex;gap:6px">
      <span class="pill pill-teal" style="font-size:10px"><i class="ti ti-user"></i>Student</span>
      <span class="pill pill-royal" style="font-size:10px"><i class="ti ti-user-star"></i>Lecturer</span>
      <span class="pill pill-purple" style="font-size:10px"><i class="ti ti-shield"></i>Admin</span>
    </div>
  </div>
  <table class="data-table" style="border:none;border-radius:0;box-shadow:none">
    <thead>
      <tr>
        <th>Permission</th>
        <th>Module</th>
        <th style="text-align:center">Student</th>
        <th style="text-align:center">Lecturer</th>
        <th style="text-align:center">Admin</th>
      </tr>
    </thead>
    <tbody>
      <!-- Use this row pattern: -->
      <tr>
        <td style="font-weight:600;color:var(--tx1)">Scan QR Attendance</td>
        <td><span class="pill pill-teal" style="font-size:10px">Attendance</span></td>
        <td style="text-align:center"><i class="ti ti-circle-check" style="color:var(--green);font-size:17px"></i></td>
        <td style="text-align:center"><i class="ti ti-minus" style="color:var(--tx4);font-size:14px"></i></td>
        <td style="text-align:center"><i class="ti ti-circle-check" style="color:var(--green);font-size:17px"></i></td>
      </tr>
      <tr>
        <td style="font-weight:600;color:var(--tx1)">Start Session</td>
        <td><span class="pill pill-teal" style="font-size:10px">Sessions</span></td>
        <td style="text-align:center"><i class="ti ti-circle-x" style="color:var(--red);font-size:17px"></i></td>
        <td style="text-align:center"><i class="ti ti-circle-check" style="color:var(--green);font-size:17px"></i></td>
        <td style="text-align:center"><i class="ti ti-circle-check" style="color:var(--green);font-size:17px"></i></td>
      </tr>
      <tr>
        <td style="font-weight:600;color:var(--tx1)">Manage Students</td>
        <td><span class="pill pill-royal" style="font-size:10px">Admin</span></td>
        <td style="text-align:center"><i class="ti ti-circle-x" style="color:var(--red);font-size:17px"></i></td>
        <td style="text-align:center"><i class="ti ti-circle-x" style="color:var(--red);font-size:17px"></i></td>
        <td style="text-align:center"><i class="ti ti-circle-check" style="color:var(--green);font-size:17px"></i></td>
      </tr>
      <tr>
        <td style="font-weight:600;color:var(--tx1)">View Own Attendance</td>
        <td><span class="pill pill-teal" style="font-size:10px">Attendance</span></td>
        <td style="text-align:center"><i class="ti ti-circle-check" style="color:var(--green);font-size:17px"></i></td>
        <td style="text-align:center"><i class="ti ti-circle-check" style="color:var(--green);font-size:17px"></i></td>
        <td style="text-align:center"><i class="ti ti-circle-check" style="color:var(--green);font-size:17px"></i></td>
      </tr>
      <tr>
        <td style="font-weight:600;color:var(--tx1)">Export Reports</td>
        <td><span class="pill pill-royal" style="font-size:10px">Reports</span></td>
        <td style="text-align:center"><i class="ti ti-circle-x" style="color:var(--red);font-size:17px"></i></td>
        <td style="text-align:center"><i class="ti ti-circle-check" style="color:var(--green);font-size:17px"></i></td>
        <td style="text-align:center"><i class="ti ti-circle-check" style="color:var(--green);font-size:17px"></i></td>
      </tr>
      <tr>
        <td style="font-weight:600;color:var(--tx1)">Manage Roles (RBAC)</td>
        <td><span class="pill pill-purple" style="font-size:10px">Security</span></td>
        <td style="text-align:center"><i class="ti ti-circle-x" style="color:var(--red);font-size:17px"></i></td>
        <td style="text-align:center"><i class="ti ti-circle-x" style="color:var(--red);font-size:17px"></i></td>
        <td style="text-align:center"><i class="ti ti-circle-check" style="color:var(--green);font-size:17px"></i></td>
      </tr>
      <tr>
        <td style="font-weight:600;color:var(--tx1)">GPS Override</td>
        <td><span class="pill pill-teal" style="font-size:10px">Security</span></td>
        <td style="text-align:center"><i class="ti ti-circle-x" style="color:var(--red);font-size:17px"></i></td>
        <td style="text-align:center"><i class="ti ti-circle-x" style="color:var(--red);font-size:17px"></i></td>
        <td style="text-align:center"><i class="ti ti-circle-check" style="color:var(--green);font-size:17px"></i></td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### Permission Edit (toggle grid)

Used inside role detail modal or dedicated edit page:

```html
<div class="perm-grid">
  <!-- Granted permission -->
  <div class="perm-row granted">
    <div>
      <div class="perm-label">Scan QR Attendance</div>
      <div style="font-size:11px;color:var(--green)">Attendance module</div>
    </div>
    <div class="tog on" onclick="this.classList.toggle('on')"></div>
  </div>
  <!-- Denied permission -->
  <div class="perm-row denied">
    <div>
      <div class="perm-label">Manage All Students</div>
      <div style="font-size:11px;color:var(--red)">Admin module</div>
    </div>
    <div class="tog" onclick="this.classList.toggle('on')"></div>
  </div>
  <!-- Partial / conditional -->
  <div class="perm-row partial">
    <div>
      <div class="perm-label">Export Reports</div>
      <div style="font-size:11px;color:var(--amber)">Own modules only</div>
    </div>
    <div class="tog on" onclick="this.classList.toggle('on')"></div>
  </div>
</div>
```

---

## Login Page

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>…tokens + fonts…</head>
<body style="margin:0;font-family:var(--sans);background:var(--page)">
<div style="min-height:100vh;display:grid;grid-template-columns:440px 1fr">
  <!-- LEFT: Form panel -->
  <div style="background:var(--card);padding:48px 40px;display:flex;flex-direction:column;justify-content:center;border-right:1px solid var(--card-bd);box-shadow:var(--sh-lg)">
    <!-- Brand -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:36px">
      <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,var(--royal),var(--accent));display:grid;place-items:center;box-shadow:var(--sh-btn)">
        <i class="ti ti-school" style="font-size:22px;color:#fff"></i>
      </div>
      <div>
        <div style="font-size:15px;font-weight:800;color:var(--tx1)">CUZ SmartCampus</div>
        <div style="font-size:11px;color:var(--tx4)">Digital ID & Attendance</div>
      </div>
    </div>
    <!-- Heading -->
    <div style="font-size:24px;font-weight:800;color:var(--tx1);margin-bottom:4px">Welcome back</div>
    <div style="font-size:13px;color:var(--tx4);margin-bottom:28px">Sign in to access your portal</div>
    <!-- Role tabs -->
    <div class="page-tabs" style="width:100%;margin-bottom:24px">
      <button class="pt-btn active" style="flex:1"><i class="ti ti-user"></i>Student</button>
      <button class="pt-btn" style="flex:1"><i class="ti ti-user-star"></i>Lecturer</button>
      <button class="pt-btn" style="flex:1"><i class="ti ti-shield"></i>Admin</button>
    </div>
    <!-- Fields -->
    <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:20px">
      <div class="field">
        <label class="field-lbl">Student ID / Email <span class="req">*</span></label>
        <div class="inp-wrap"><i class="ti ti-id-badge-2"></i><input class="inp" placeholder="103-497 or email"/></div>
      </div>
      <div class="field">
        <label class="field-lbl">Password <span class="req">*</span></label>
        <div class="inp-wrap"><i class="ti ti-lock"></i><input class="inp" type="password" placeholder="••••••••"/></div>
      </div>
    </div>
    <button class="btn btn-primary" style="width:100%;justify-content:center;padding:11px">
      <i class="ti ti-login"></i>Sign In
    </button>
    <div style="text-align:center;margin-top:16px;font-size:12.5px;color:var(--tx4)">
      Forgot your password? <a href="#" style="color:var(--royal);font-weight:600;text-decoration:none">Reset it</a>
    </div>
  </div>
  <!-- RIGHT: Brand panel -->
  <div style="background:linear-gradient(135deg,#0F2347 0%,#1B3F9A 50%,#2563EB 100%);display:flex;flex-direction:column;justify-content:center;padding:48px 56px">
    <div style="font-size:36px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:16px">
      Smart Campus<br/>Digital Attendance
    </div>
    <div style="font-size:15px;color:rgba(255,255,255,.7);margin-bottom:40px">
      Cavendish University Zambia — QR-based, GPS-verified, fraud-proof attendance tracking.
    </div>
    <!-- Feature bullets -->
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;align-items:center;gap:12px;color:rgba(255,255,255,.85);font-size:13.5px">
        <div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.12);display:grid;place-items:center;flex-shrink:0">
          <i class="ti ti-qrcode" style="font-size:17px;color:#fff"></i>
        </div>QR Code identity — refreshes every 30 seconds
      </div>
      <div style="display:flex;align-items:center;gap:12px;color:rgba(255,255,255,.85);font-size:13.5px">
        <div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.12);display:grid;place-items:center;flex-shrink:0">
          <i class="ti ti-map-pin" style="font-size:17px;color:#fff"></i>
        </div>GPS geofencing — confirms on-campus presence
      </div>
      <div style="display:flex;align-items:center;gap:12px;color:rgba(255,255,255,.85);font-size:13.5px">
        <div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.12);display:grid;place-items:center;flex-shrink:0">
          <i class="ti ti-shield-check" style="font-size:17px;color:#fff"></i>
        </div>RBAC access control — student, lecturer, admin
      </div>
    </div>
  </div>
</div>
</body>
</html>
```

---

## GPS Verification — Three States

### State 1: Checking

```html
<div class="gps-widget">
  <div class="card-title" style="margin-bottom:12px">
    <i class="ti ti-map-pin" style="color:var(--amber);margin-right:6px"></i>Verifying Location…
  </div>
  <div class="gps-map-mock">
    <div class="gps-grid"></div>
    <!-- amber ring instead of green -->
    <div class="gps-ring" style="border-color:rgba(217,119,6,.4)"></div>
    <div class="gps-dot" style="background:var(--amber);box-shadow:0 0 0 8px rgba(217,119,6,.2),0 0 20px rgba(217,119,6,.4)"></div>
  </div>
  <div class="gps-label-row">
    <div class="gps-status" style="color:var(--amber)">Checking GPS…</div>
    <div class="gps-coords">Acquiring signal</div>
  </div>
</div>
```

### State 2: On Campus ✓

```html
<!-- gps-status class: gps-status (green by default) -->
<div class="gps-status">On Campus · Verified</div>
<div class="gps-coords">-15.4166, 28.2827</div>
```

### State 3: Off Campus ✗

```html
<div class="gps-status off">Off Campus · Blocked</div>
<div class="gps-coords">-15.4189, 28.2901</div>
```
