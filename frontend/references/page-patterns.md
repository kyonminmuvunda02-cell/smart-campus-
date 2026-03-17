# Smart Campus CUZ — Page Patterns

Canonical layouts for every page type. Load `design-tokens.md` first.

---

## Shell layout (with sidebar)

```css
.app { display: grid; grid-template-columns: var(--sb-w) 1fr; grid-template-rows: var(--nav-h) 1fr; height: 100vh; overflow: hidden; }
.sidebar { grid-row: 1 / 3; }
.topbar  { grid-column: 2; }
.content { grid-column: 2; overflow-y: auto; padding: 24px 28px 60px; display: flex; flex-direction: column; gap: 28px; }
```

---

## Student Dashboard

Structure:
1. Page header (greeting + "Scan QR" CTA)
2. Stat row — 4 cards: Attendance Rate, Classes Attended, Absences, Active Modules
3. Two-column grid: attendance table (left) + GPS widget + Today's classes timeline (right)

```html
<!-- Stat row -->
<div class="stat-row">
  <div class="stat-card blue">…Attendance Rate…</div>
  <div class="stat-card green">…Classes Attended…</div>
  <div class="stat-card amber">…Absences…</div>
  <div class="stat-card teal">…Active Modules…</div>
</div>

<!-- Two-col -->
<div style="display:grid;grid-template-columns:1fr 340px;gap:18px">
  <!-- attendance table -->
  <table class="data-table">…</table>
  <!-- right column -->
  <div style="display:flex;flex-direction:column;gap:14px">
    <div class="gps-widget">…</div>
    <div class="card">…timeline…</div>
  </div>
</div>
```

---

## My Digital ID (Student)

Structure:
1. Page header
2. Two columns: ID card (left, 320px) + info panel (right)
3. Right panel: verified callout + how-it-works timeline + 2 mini stat cards

```html
<div style="display:grid;grid-template-columns:320px 1fr;gap:20px;align-items:start">
  <div>
    <div class="section-label">Digital ID Card</div>
    <div class="id-card">…</div>
  </div>
  <div style="display:flex;flex-direction:column;gap:16px">
    <div class="callout callout-success">…Identity Verified…</div>
    <div class="card">…How It Works timeline…</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="stat-card green">…Check-ins Today…</div>
      <div class="stat-card blue">…QR Refreshes…</div>
    </div>
  </div>
</div>
```

---

## My Attendance (Student)

Structure:
1. Page header + filter chips + export button
2. 5-column stat row: Present, Absent, Late, Excused, Overall Rate
3. Warning callout if any module < 75%
4. Per-module table with progress bars

```html
<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px">
  <div class="stat-card green">…Present…</div>
  <div class="stat-card red">…Absent…</div>
  <div class="stat-card amber">…Late…</div>
  <div class="stat-card purple">…Excused…</div>
  <div class="stat-card blue">…Overall Rate…</div>
</div>
<div class="callout callout-warn">…Low attendance warning…</div>
<table class="data-table">…per-module rows…</table>
```

---

## Student Management (Admin)

Structure:
1. Page header + Bulk Import + Add Student CTAs
2. Filter chips + search input + filter button
3. Full-width data table with checkbox, avatar, ID, programme, year, attendance %, status, last scan
4. Pagination row

---

## Live Sessions (Admin / Lecturer)

Structure:
1. Page header with live indicator pill + New Session button
2. 3-column session card grid (live / live / ended)

```html
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
  <div class="session-card live">…</div>
  <div class="session-card warn">…</div>
  <div class="session-card ended">…</div>
</div>
```

Each session card structure:
```html
<div class="card-hd">
  <div><div class="card-title">CS301 — Web Dev</div><div style="font-size:11.5px;color:var(--tx4)">Dr. Banda · Room 105</div></div>
  <span class="pill pill-green"><i class="ti ti-circle-filled"></i>Live</span>
</div>
<div class="card-body">
  <div style="display:flex;justify-content:space-between;margin-bottom:12px">
    <div><div class="sc-label">Scanned In</div><div class="sc-num" style="font-size:22px;color:var(--green)">34</div></div>
    <div><div class="sc-label">Absent</div><div class="sc-num" style="font-size:22px;color:var(--red)">6</div></div>
    <div><div class="sc-label">Total</div><div class="sc-num" style="font-size:22px">40</div></div>
  </div>
  <div class="prog-bar" style="height:7px"><div class="prog-fill" style="width:85%;background:var(--green)"></div></div>
  <div style="font-size:11.5px;color:var(--tx4);margin-top:8px">Session ends in <span class="mono">48 min</span></div>
</div>
```

---

## Settings (All roles)

Structure:
1. Page header
2. Two columns: profile form (left) + security card + notifications card + danger zone (right)

Profile form structure:
- Avatar with upload button
- 2-col form grid: first name, last name, email (full-width), student ID (read-only), programme (read-only)
- Save / Cancel buttons

---

## Auth — Login Page

Structure: Full-screen two-panel layout

```html
<div style="min-height:100vh;display:grid;grid-template-columns:420px 1fr">
  <!-- Left: form panel -->
  <div style="background:var(--card);padding:40px 36px;display:flex;flex-direction:column;justify-content:center;border-right:1px solid var(--card-bd)">
    <!-- Logo + title -->
    <!-- Role selector tabs -->
    <!-- Email / password fields -->
    <!-- Login button -->
    <!-- Forgot password link -->
  </div>
  <!-- Right: brand panel -->
  <div style="background:linear-gradient(135deg,#0F2347,#1B3F9A);…">
    <!-- Branding, system name, feature bullets -->
  </div>
</div>
```

Role selector (Student / Lecturer / Admin):
```html
<div class="page-tabs" style="width:100%;justify-content:stretch">
  <button class="pt-btn active" style="flex:1"><i class="ti ti-user"></i>Student</button>
  <button class="pt-btn" style="flex:1"><i class="ti ti-user-star"></i>Lecturer</button>
  <button class="pt-btn" style="flex:1"><i class="ti ti-shield"></i>Admin</button>
</div>
```

---

## 404 / Empty State

```html
<div style="text-align:center;padding:60px 20px">
  <div style="width:64px;height:64px;border-radius:16px;background:var(--royal-lt);display:grid;place-items:center;margin:0 auto 18px">
    <i class="ti ti-mood-empty" style="font-size:32px;color:var(--royal)"></i>
  </div>
  <div style="font-size:16px;font-weight:700;color:var(--tx1);margin-bottom:6px">No records found</div>
  <div style="font-size:13px;color:var(--tx4);margin-bottom:18px">Try adjusting your filters or search query.</div>
  <button class="btn btn-outline btn-sm"><i class="ti ti-refresh"></i>Reset Filters</button>
</div>
```
