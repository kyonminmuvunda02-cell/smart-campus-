# Smart Campus CUZ — Mobile View

Mobile-first responsive design for the Smart Campus system. Breakpoints, layout shifts, navigation patterns, and every component's mobile behavior.

---

## Breakpoints

```css
/* Mobile first — add these to your <style> block */
:root {
  --sb-w: 224px;
  --nav-h: 54px;
}

/* Tablet */
@media (max-width: 768px) { /* md */ }

/* Mobile */
@media (max-width: 480px) { /* sm */ }
```

| Breakpoint | Name | Behavior |
|------------|------|----------|
| ≥ 1024px | Desktop | Full sidebar + topbar layout |
| 769–1023px | Tablet | Collapsed icon-only sidebar OR overlay drawer |
| ≤ 768px | Mobile | Hamburger drawer, bottom nav, stacked layout |
| ≤ 480px | Small mobile | Single-column, full-width cards |

---

## Responsive shell layout

```css
/* Desktop: sidebar + content grid */
.app {
  display: grid;
  grid-template-columns: var(--sb-w) 1fr;
  grid-template-rows: var(--nav-h) 1fr;
  height: 100vh; overflow: hidden;
}
.sidebar  { grid-row: 1 / 3; }
.topbar   { grid-column: 2; }
.content  { grid-column: 2; overflow-y: auto; padding: 24px 28px 60px; }

/* Tablet & mobile: sidebar becomes drawer */
@media (max-width: 768px) {
  .app {
    grid-template-columns: 1fr;
    grid-template-rows: var(--nav-h) 1fr;
  }
  .topbar  { grid-column: 1; }
  .content { grid-column: 1; padding: 16px 16px 100px; }

  /* Sidebar becomes fixed overlay drawer */
  .sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 200;
    transform: translateX(-100%);
    transition: transform .25s ease;
    box-shadow: var(--sh-xl);
  }
  .sidebar.open { transform: translateX(0); }

  /* Dim overlay behind drawer */
  .sb-overlay {
    display: block;
    position: fixed; inset: 0;
    background: rgba(0,0,0,.5);
    z-index: 199;
    opacity: 0; pointer-events: none;
    transition: opacity .25s;
  }
  .sb-overlay.open { opacity: 1; pointer-events: all; }
}
```

---

## Mobile topbar

On mobile, show hamburger + logo + right icons. Hide search bar (move to page-level search).

```html
<!-- Mobile topbar structure -->
<header class="topbar">
  <!-- Hamburger (mobile only) -->
  <button class="tb-btn tb-hamburger" id="menuToggle" title="Menu">
    <i class="ti ti-menu-2" style="font-size:18px"></i>
  </button>

  <!-- Logo (mobile) -->
  <div class="tb-mobile-brand">
    <div style="width:26px;height:26px;border-radius:6px;background:var(--royal);display:grid;place-items:center">
      <i class="ti ti-school" style="font-size:14px;color:#fff"></i>
    </div>
    <span style="font-size:13px;font-weight:800;color:var(--tx1)">SmartCampus</span>
  </div>

  <div class="tb-spacer"></div>

  <!-- Right icons — always visible -->
  <button class="tb-btn" id="themeToggle"><i class="ti ti-moon" id="themeIcon" style="font-size:16px"></i></button>
  <button class="tb-btn"><i class="ti ti-bell" style="font-size:16px"></i><div class="tb-notif-dot"></div></button>
  <div class="tb-av">MM</div>
</header>
```

```css
.tb-hamburger  { display: none; }
.tb-mobile-brand { display: none; align-items: center; gap: 8px; }

@media (max-width: 768px) {
  .tb-hamburger    { display: grid; }
  .tb-mobile-brand { display: flex; }
  .tb-search       { display: none; } /* hide desktop search on mobile */
  .tb-role-pill    { display: none; } /* hide role pill on mobile */
}
```

Drawer JS:
```js
const menuToggle = document.getElementById('menuToggle');
const sidebar    = document.querySelector('.sidebar');
const overlay    = document.querySelector('.sb-overlay');

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
});
overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
});
// Close drawer on nav item click
document.querySelectorAll('.sb-item').forEach(item => {
  item.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
});
```

---

## Bottom navigation bar (mobile)

Replace or supplement sidebar navigation on small screens. Show 4–5 most-used items.

```html
<nav class="bottom-nav" id="bottomNav">
  <button class="bn-item active" onclick="showPage('dashboard')">
    <i class="ti ti-layout-dashboard"></i>
    <span>Home</span>
  </button>
  <button class="bn-item" onclick="showPage('digital-id')">
    <i class="ti ti-qrcode"></i>
    <span>My ID</span>
  </button>
  <button class="bn-item" onclick="showPage('attendance')">
    <i class="ti ti-calendar-check"></i>
    <span>Attendance</span>
    <div class="bn-badge">3</div>
  </button>
  <button class="bn-item" onclick="showPage('schedule')">
    <i class="ti ti-clock"></i>
    <span>Schedule</span>
  </button>
  <button class="bn-item" onclick="showPage('settings')">
    <i class="ti ti-settings"></i>
    <span>Settings</span>
  </button>
</nav>
```

```css
.bottom-nav {
  display: none; /* hidden on desktop */
  position: fixed; bottom: 0; left: 0; right: 0;
  background: var(--card); border-top: 1px solid var(--card-bd);
  box-shadow: 0 -4px 16px rgba(12,26,53,.08);
  z-index: 100; padding: 6px 0 env(safe-area-inset-bottom);
  justify-content: space-around; align-items: center;
}
.bn-item {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 6px 12px; border: none; background: none;
  color: var(--tx4); font-family: var(--sans); font-size: 10px; font-weight: 600;
  cursor: pointer; position: relative; transition: color .14s; min-width: 60px;
}
.bn-item i    { font-size: 22px; }
.bn-item.active { color: var(--royal); }
.bn-item.active i { color: var(--royal); }
.bn-badge {
  position: absolute; top: 2px; right: 8px;
  background: var(--red); color: #fff;
  font-size: 9px; font-weight: 700; font-family: var(--mono);
  padding: 1px 5px; border-radius: var(--r-full);
  border: 1.5px solid var(--card);
}

@media (max-width: 768px) {
  .bottom-nav { display: flex; }
}

[data-theme="dark"] .bottom-nav {
  background: #152035;
  box-shadow: 0 -4px 16px rgba(0,0,0,.3);
}
```

---

## Stat row — mobile stacking

```css
.stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }

@media (max-width: 768px) {
  .stat-row { grid-template-columns: repeat(2, 1fr); gap: 10px; }
}
@media (max-width: 480px) {
  .stat-row { grid-template-columns: 1fr 1fr; gap: 8px; }
  .stat-card { padding: 14px; }
  .sc-num    { font-size: 22px; }
}
```

5-column variant (attendance page):
```css
@media (max-width: 768px) {
  .stat-row-5 { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 480px) {
  .stat-row-5 { grid-template-columns: repeat(2, 1fr); }
}
```

---

## Two-column layouts — mobile collapse

All `display:grid;grid-template-columns:X Y` layouts must collapse to single column:

```css
/* Dashboard: main + right sidebar */
.dash-grid { display: grid; grid-template-columns: 1fr 340px; gap: 18px; }

@media (max-width: 1024px) {
  .dash-grid { grid-template-columns: 1fr; }
}

/* Digital ID: card + info panel */
.id-grid { display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }

@media (max-width: 768px) {
  .id-grid { grid-template-columns: 1fr; }
  .id-card { max-width: 100%; }
}

/* Settings: profile + security */
.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

@media (max-width: 768px) {
  .settings-grid { grid-template-columns: 1fr; }
}

/* Login: form + brand */
.login-grid { display: grid; grid-template-columns: 440px 1fr; min-height: 100vh; }

@media (max-width: 768px) {
  .login-grid { grid-template-columns: 1fr; grid-template-rows: auto; }
  .login-brand { display: none; } /* hide brand panel on mobile login */
}
```

---

## Data table — mobile scroll

Tables must never overflow on mobile. Wrap in a scroll container:

```html
<div class="table-scroll">
  <table class="data-table">…</table>
</div>
```

```css
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: var(--r-xl);
}
/* Maintain border-radius on scroll wrapper */
.table-scroll .data-table { border-radius: 0; box-shadow: none; border: none; }
.table-scroll              { border: 1px solid var(--card-bd); box-shadow: var(--sh-sm); }

/* Hide less important columns on mobile */
@media (max-width: 768px) {
  .data-table .col-hide-md { display: none; }
}
@media (max-width: 480px) {
  .data-table .col-hide-sm { display: none; }
  .data-table td, .data-table th { padding: 10px 12px; }
}
```

Columns to hide on mobile (add class `col-hide-md` or `col-hide-sm`):
- `col-hide-md`: Lecturer, Programme, Year, Last Scan
- `col-hide-sm`: Date/Time (keep status + name)

---

## Page header — mobile

```css
@media (max-width: 768px) {
  .page-hd { flex-wrap: wrap; gap: 12px; }
  .ph-title { font-size: 18px; }
  .ph-sub   { font-size: 12px; }
  .ph-actions { width: 100%; }
  .ph-actions .btn { flex: 1; justify-content: center; }
}
@media (max-width: 480px) {
  .ph-actions { flex-wrap: wrap; }
  .ph-actions .btn { font-size: 12px; padding: 7px 12px; }
}
```

---

## Filter chips — mobile scroll

```css
.filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }

@media (max-width: 480px) {
  .filter-chips {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
  }
  .filter-chip { flex-shrink: 0; }
}
```

---

## Modal — mobile full-screen

```css
@media (max-width: 480px) {
  .modal-overlay { align-items: flex-end; }
  .modal-box {
    width: 100%; max-width: 100%;
    border-radius: var(--r-2xl) var(--r-2xl) 0 0;
    max-height: 92vh;
  }
}
```

Add drag-handle for bottom sheet feel:
```html
<!-- Inside .modal-box, before .modal-hd -->
<div class="modal-handle"></div>
```
```css
.modal-handle {
  display: none;
  width: 36px; height: 4px;
  border-radius: 2px;
  background: var(--card-bd);
  margin: 10px auto 0;
}
@media (max-width: 480px) {
  .modal-handle { display: block; }
}
```

---

## QR scan modal — mobile

On mobile the QR scan modal becomes a full-screen bottom sheet:
- QR code centered, larger (160px square)
- GPS widget below QR — full width
- Confirm button is full-width, larger tap target

```css
@media (max-width: 480px) {
  #scanModal .modal-body { padding: 16px; }
  #scanModal .id-qr-area { width: 160px; height: 160px; }
  #scanModal .modal-ft .btn { flex: 1; justify-content: center; padding: 12px; }
}
```

---

## GPS widget — mobile

```css
@media (max-width: 480px) {
  .gps-widget { padding: 14px; }
  .gps-map-mock { height: 100px; }
}
```

---

## Digital ID card — mobile

```css
@media (max-width: 480px) {
  .id-card { max-width: 100%; }
  .id-card-banner { padding: 16px; gap: 12px; }
  .id-qr-area { padding: 8px; }
}
```

---

## Session cards — mobile

```css
.sessions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

@media (max-width: 1024px) {
  .sessions-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .sessions-grid { grid-template-columns: 1fr; }
}
```

---

## RBAC role cards — mobile

```css
.role-cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

@media (max-width: 768px) {
  .role-cards-grid { grid-template-columns: 1fr; }
}
```

Permission matrix table — wrap in `.table-scroll` and add `col-hide-md` to less critical columns.

---

## Form grid — mobile

```css
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
  .form-grid [style*="grid-column:1/-1"] { grid-column: 1; }
}
```

---

## Page tabs — mobile scroll

```css
@media (max-width: 480px) {
  .page-tabs {
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .pt-btn { flex: 1; padding: 8px 12px; font-size: 12px; }
  .pt-btn span { display: none; } /* icon-only tabs if needed */
}
```

---

## Typography — mobile scale-down

```css
@media (max-width: 480px) {
  .ph-title  { font-size: 18px; }
  .sc-num    { font-size: 22px; }
  .card-title { font-size: 13px; }
}
```

---

## Content padding — mobile

```css
@media (max-width: 768px) {
  .content { padding: 16px 16px 100px; gap: 16px; } /* 100px for bottom nav */
}
@media (max-width: 480px) {
  .content { padding: 12px 12px 100px; gap: 12px; }
}
```

---

## Safe area insets (notch / home bar)

```css
/* Apply to bottom nav and fixed elements */
.bottom-nav {
  padding-bottom: calc(6px + env(safe-area-inset-bottom));
}
.content {
  padding-bottom: calc(100px + env(safe-area-inset-bottom));
}
```

---

## Touch targets

All interactive elements must be at least 44×44px on mobile:

```css
@media (max-width: 768px) {
  .act-ico { width: 36px; height: 36px; }
  .pag-btn { width: 36px; height: 36px; }
  .tog      { width: 44px; height: 24px; }
  .tog::after { width: 18px; height: 18px; top: 3px; }
  .tog.on::after { transform: translateX(20px); }
  .filter-chip  { padding: 8px 16px; }
  .btn-xs  { padding: 7px 12px; font-size: 11.5px; }
}
```

---

## Mobile complete example — add to existing HTML

Drop this block inside `<style>` after all desktop styles:

```css
/* ═══ MOBILE RESPONSIVE ═══ */
.sb-overlay { display: none; }

@media (max-width: 768px) {
  /* Shell */
  .app { grid-template-columns: 1fr; }
  .topbar { grid-column: 1; }
  .content { grid-column: 1; padding: 16px 16px 100px; gap: 16px; }

  /* Sidebar drawer */
  .sidebar { position: fixed; top: 0; left: 0; bottom: 0; z-index: 200; transform: translateX(-100%); transition: transform .25s ease; box-shadow: var(--sh-xl); }
  .sidebar.open { transform: translateX(0); }
  .sb-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 199; opacity: 0; pointer-events: none; transition: opacity .25s; }
  .sb-overlay.open { opacity: 1; pointer-events: all; }

  /* Topbar */
  .tb-hamburger { display: grid; }
  .tb-mobile-brand { display: flex; }
  .tb-search { display: none; }
  .tb-role-pill { display: none; }
  .tb-spacer { flex: 1; }

  /* Bottom nav */
  .bottom-nav { display: flex; }

  /* Layouts */
  .stat-row { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .dash-grid { grid-template-columns: 1fr; }
  .id-grid { grid-template-columns: 1fr; }
  .settings-grid { grid-template-columns: 1fr; }
  .sessions-grid { grid-template-columns: repeat(2, 1fr); }
  .role-cards-grid { grid-template-columns: 1fr; }

  /* Page header */
  .page-hd { flex-wrap: wrap; gap: 12px; }
  .ph-title { font-size: 18px; }
  .ph-actions { width: 100%; }
  .ph-actions .btn { flex: 1; justify-content: center; }

  /* Forms */
  .form-grid { grid-template-columns: 1fr; }

  /* Modal bottom sheet */
  .modal-overlay { align-items: flex-end; }
  .modal-box { width: 100%; max-width: 100%; border-radius: var(--r-2xl) var(--r-2xl) 0 0; max-height: 92vh; }
  .modal-handle { display: block; }

  /* Filter chips scroll */
  .filter-chips { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; padding-bottom: 4px; }
  .filter-chip  { flex-shrink: 0; }

  /* Touch targets */
  .act-ico { width: 36px; height: 36px; }
  .pag-btn { width: 36px; height: 36px; }
}

@media (max-width: 480px) {
  .content  { padding: 12px 12px 100px; gap: 12px; }
  .stat-row { gap: 8px; }
  .stat-card { padding: 14px; }
  .sc-num   { font-size: 22px; }
  .ph-title { font-size: 17px; }
  .sessions-grid { grid-template-columns: 1fr; }
  .data-table td, .data-table th { padding: 10px 12px; }
}
```

---

## Mobile quality checklist

- [ ] Sidebar becomes drawer at ≤ 768px — opens on hamburger tap
- [ ] Overlay dims background when drawer is open
- [ ] Bottom nav appears at ≤ 768px with 4–5 key items
- [ ] Bottom nav uses `safe-area-inset-bottom` for notched devices
- [ ] Stat row: 2-col at ≤ 768px, still 2-col at ≤ 480px
- [ ] All `grid-template-columns: X Y` collapse to `1fr` at ≤ 768px
- [ ] Data tables wrapped in `.table-scroll` — no horizontal overflow
- [ ] Less important table columns hidden via `.col-hide-md` / `.col-hide-sm`
- [ ] Modals become bottom sheets at ≤ 480px with drag handle
- [ ] Filter chips scroll horizontally (no wrapping overflow)
- [ ] Page header wraps and buttons go full-width
- [ ] Form grids collapse to single column
- [ ] All tap targets ≥ 44×44px
- [ ] Content bottom padding accounts for bottom nav height (100px)
- [ ] Login page hides brand panel on mobile — form fills full screen
- [ ] Dark mode + mobile: sidebar overlay darkened to `rgba(0,0,0,.7)`
