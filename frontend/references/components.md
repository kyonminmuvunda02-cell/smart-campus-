# Smart Campus CUZ — Component Library

All CSS patterns. Values reference tokens from `design-tokens.md`.

---

## App Shell

```css
/* Grid shell */
.app {
  display: grid;
  grid-template-columns: var(--sb-w) 1fr;
  grid-template-rows: var(--nav-h) 1fr;
  height: 100vh; overflow: hidden;
}
.sidebar  { grid-row: 1 / 3; }
.topbar   { grid-column: 2; }
.content  { grid-column: 2; overflow-y: auto; padding: 24px 28px 60px; display: flex; flex-direction: column; gap: 28px; }
```

---

## Sidebar

```css
.sidebar        { background: #1B3F9A; overflow-y: auto; scrollbar-width: none; display: flex; flex-direction: column; }
[data-theme="dark"] .sidebar { background: #0B1525; }
.sb-brand       { padding: 14px 16px 10px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,.1); }
.sb-logo        { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,.15); display: grid; place-items: center; }
.sb-logo i      { font-size: 18px; color: #fff; }
.sb-name        { font-size: 13px; font-weight: 800; color: #fff; }
.sb-sub         { font-size: 10.5px; color: rgba(255,255,255,.5); }
.sb-section     { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,.35); padding: 14px 18px 4px; }
.sb-item        { display: flex; align-items: center; gap: 9px; padding: 7px 10px; margin: 1px 8px; border-radius: 6px; color: rgba(255,255,255,.7); font-size: 12.5px; font-weight: 500; cursor: pointer; border: none; background: none; width: calc(100% - 16px); text-align: left; transition: all .14s; position: relative; }
.sb-item:hover  { background: rgba(255,255,255,.08); color: #fff; }
.sb-item.active { background: rgba(255,255,255,.13); color: #fff; font-weight: 600; }
.sb-item.active::before { content: ''; position: absolute; left: -10px; top: 50%; transform: translateY(-50%); width: 2.5px; height: 20px; background: #C9920A; border-radius: 2px; box-shadow: 0 0 8px rgba(201,146,10,.4); }
.sb-item i      { font-size: 16px; opacity: .7; }
.sb-item.active i { opacity: 1; }
.sb-badge       { margin-left: auto; background: var(--accent); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: var(--r-full); font-family: var(--mono); }
.sb-badge.urgent { background: var(--red); }
.sb-footer      { margin-top: auto; padding: 12px 16px; border-top: 1px solid rgba(255,255,255,.1); display: flex; align-items: center; gap: 10px; }
.sb-av          { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,.2); display: grid; place-items: center; color: #fff; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.sb-user-name   { font-size: 12px; font-weight: 600; color: #fff; }
.sb-user-role   { font-size: 10.5px; color: rgba(255,255,255,.5); }
```

---

## Topbar

```css
.topbar   { background: var(--card); border-bottom: 1px solid var(--card-bd); box-shadow: var(--sh-sm); display: flex; align-items: center; padding: 0 20px; gap: 12px; z-index: 10; }
.tb-search { flex: 1; max-width: 340px; position: relative; }
.tb-search input { width: 100%; padding: 7px 12px 7px 34px; border-radius: var(--r-md); border: 1.5px solid var(--card-bd); background: var(--input-bg); font-family: var(--sans); font-size: 12.5px; color: var(--tx1); outline: none; transition: border-color .14s; }
.tb-search input:focus { border-color: rgba(37,99,235,.5); }
.tb-search i { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 14px; color: var(--tx4); }
.tb-btn   { width: 34px; height: 34px; border-radius: 6px; border: 1px solid var(--card-bd); background: var(--card); display: grid; place-items: center; cursor: pointer; color: var(--tx3); position: relative; transition: all .14s; }
.tb-btn:hover { border-color: var(--royal); color: var(--royal); }
.tb-notif-dot { position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; border-radius: 50%; background: var(--red); border: 1px solid var(--card); }
.tb-divider { width: 1px; height: 22px; background: var(--card-bd); }
.tb-av    { width: 30px; height: 30px; border-radius: 50%; background: var(--royal-lt); border: 1.5px solid rgba(37,99,235,.2); display: grid; place-items: center; cursor: pointer; font-size: 12px; font-weight: 700; color: var(--royal); }
.tb-role-pill { padding: 3px 9px; border-radius: var(--r-full); font-size: 10.5px; font-weight: 700; background: var(--royal-lt); color: var(--royal); }
```

---

## Page Header

```css
.page-hd  { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.ph-left  { display: flex; align-items: center; gap: 12px; }
.ph-icon  { width: 38px; height: 38px; border-radius: 10px; background: var(--royal-lt); border: 1px solid rgba(37,99,235,.15); display: grid; place-items: center; flex-shrink: 0; }
.ph-icon i { font-size: 20px; color: var(--royal); }
.ph-title { font-size: 22px; font-weight: 800; color: var(--tx1); letter-spacing: -.3px; }
.ph-sub   { font-size: 13px; color: var(--tx4); margin-top: 2px; }
.ph-actions { display: flex; gap: 8px; flex-shrink: 0; align-items: center; }
```

---

## Buttons

```css
.btn      { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--r-md); font-size: 12.5px; font-weight: 600; cursor: pointer; border: none; transition: all .14s; line-height: 1; white-space: nowrap; font-family: var(--sans); }
.btn i    { font-size: 15px; }
.btn-sm   { padding: 5px 12px; font-size: 12px; }
.btn-xs   { padding: 3px 9px; font-size: 11px; }
.btn-icon { width: 34px; height: 34px; padding: 0; justify-content: center; }

.btn-primary  { background: var(--royal); color: #fff; box-shadow: var(--sh-btn); }
.btn-primary:hover { background: var(--accent); box-shadow: 0 4px 14px rgba(27,63,154,.36); }
.btn-outline  { background: var(--card); border: 1px solid var(--card-bd); color: var(--tx2); box-shadow: var(--sh-sm); }
.btn-outline:hover { border-color: var(--royal); color: var(--royal); background: var(--royal-lt); }
.btn-green    { background: var(--green); color: #fff; }
.btn-green:hover { opacity: .88; }
.btn-danger   { background: var(--red-lt); border: 1px solid rgba(220,38,38,.25); color: var(--red); }
.btn-danger:hover { background: var(--red); color: #fff; }
.btn-amber    { background: var(--amber-lt); border: 1px solid rgba(217,119,6,.25); color: var(--amber); }
.btn-teal     { background: var(--teal-lt); border: 1px solid rgba(8,145,178,.2); color: var(--teal); }
```

---

## Status Pills

```css
.pill     { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: var(--r-full); letter-spacing: .02em; }
.pill i   { font-size: 12px; }

/* Attendance */
.pill-present  { background: var(--green-lt);  color: var(--green);  }
.pill-absent   { background: var(--red-lt);    color: var(--red);    }
.pill-late     { background: var(--amber-lt);  color: var(--amber);  }
.pill-excused  { background: var(--purple-lt); color: var(--purple); }

/* System */
.pill-green    { background: var(--green-lt);  color: var(--green);  }
.pill-royal    { background: var(--royal-lt);  color: var(--royal);  }
.pill-amber    { background: var(--amber-lt);  color: var(--amber);  }
.pill-red      { background: var(--red-lt);    color: var(--red);    }
.pill-purple   { background: var(--purple-lt); color: var(--purple); }
.pill-teal     { background: var(--teal-lt);   color: var(--teal);   }
.pill-gray     { background: var(--panel-bd);  color: var(--tx4); border: 1px solid var(--card-bd); }

/* Roles */
.pill-student  { background: var(--teal-lt);   color: var(--teal);   }
.pill-lecturer { background: var(--royal-lt);  color: var(--royal);  }
.pill-admin    { background: var(--purple-lt); color: var(--purple); }
```

JS pill helper:
```js
function attendancePill(status) {
  const map = {
    present: ['pill-present','ti-check','Present'],
    absent:  ['pill-absent','ti-x','Absent'],
    late:    ['pill-late','ti-clock','Late'],
    excused: ['pill-excused','ti-file-text','Excused'],
  };
  const [cls,ico,lbl] = map[status] || map.absent;
  return `<span class="pill ${cls}"><i class="ti ${ico}"></i>${lbl}</span>`;
}
```

---

## Cards

```css
.card       { background: var(--card); border: 1px solid var(--card-bd); border-radius: var(--r-xl); box-shadow: var(--sh-sm); overflow: hidden; transition: box-shadow .18s; }
.card:hover { box-shadow: var(--sh-hov); }
.card-hd    { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--card-bd); }
.card-title { font-size: 13.5px; font-weight: 700; color: var(--tx1); }
.card-body  { padding: 18px; }
```

### Stat card

```css
.stat-row  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.stat-card { background: var(--card); border: 1px solid var(--card-bd); border-radius: var(--r-xl); padding: 20px; box-shadow: var(--sh-sm); display: flex; flex-direction: column; gap: 10px; position: relative; overflow: hidden; }
.stat-card::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: var(--r-xl) var(--r-xl) 0 0; }
.stat-card.blue::after   { background: var(--accent); }
.stat-card.green::after  { background: var(--green);  }
.stat-card.amber::after  { background: var(--amber);  }
.stat-card.red::after    { background: var(--red);    }
.stat-card.teal::after   { background: var(--teal);   }
.stat-card.purple::after { background: var(--purple); }
.sc-top   { display: flex; align-items: center; justify-content: space-between; }
.sc-icon  { width: 36px; height: 36px; border-radius: 9px; display: grid; place-items: center; }
.sc-icon i { font-size: 19px; }
.sc-num   { font-family: var(--mono); font-size: 28px; font-weight: 500; line-height: 1; color: var(--tx1); }
.sc-label { font-size: 12px; color: var(--tx4); font-weight: 500; }
.sc-delta { font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 3px; }
.sc-delta.up   { color: var(--green); }
.sc-delta.down { color: var(--red); }
```

### Session card (live monitoring)

```css
.session-card { background: var(--card); border: 1px solid var(--card-bd); border-radius: var(--r-xl); box-shadow: var(--sh-sm); overflow: hidden; }
.session-card.live   { border-top: 3px solid var(--green); }
.session-card.warn   { border-top: 3px solid var(--amber); }
.session-card.ended  { border-top: 3px solid var(--card-bd); opacity: .75; }
```

---

## Data Table

```css
.data-table   { width: 100%; border-collapse: separate; border-spacing: 0; background: var(--card); border: 1px solid var(--card-bd); border-radius: var(--r-xl); overflow: hidden; box-shadow: var(--sh-sm); }
.data-table th { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .7px; color: var(--tx4); padding: 11px 16px; text-align: left; background: var(--panel-bd); border-bottom: 1px solid var(--card-bd); }
.data-table td { padding: 13px 16px; border-bottom: 1px solid var(--panel-bd); vertical-align: middle; font-size: 12.5px; color: var(--tx2); }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr { cursor: pointer; transition: background .12s; }
.data-table tbody tr:hover td { background: var(--royal-lt); }
.data-table tbody tr.sel td   { background: var(--royal-md); }
```

---

## Inputs & Forms

```css
.field      { display: flex; flex-direction: column; gap: 4px; }
.field-lbl  { font-size: 11.5px; font-weight: 600; color: var(--tx2); }
.field-lbl .req { color: var(--red); margin-left: 2px; }
.inp        { width: 100%; padding: 8px 12px; border-radius: var(--r-md); border: 1.5px solid var(--card-bd); background: var(--input-bg); font-family: var(--sans); font-size: 13px; color: var(--tx1); outline: none; transition: border-color .14s; }
.inp:focus  { border-color: rgba(37,99,235,.5); box-shadow: 0 0 0 3px rgba(37,99,235,.08); }
.inp::placeholder { color: var(--tx4); }
.inp-wrap   { display: flex; align-items: center; gap: 8px; padding: 0 11px; background: var(--input-bg); border: 1.5px solid var(--card-bd); border-radius: var(--r-md); }
.inp-wrap i { font-size: 15px; color: var(--tx4); flex-shrink: 0; }
.inp-wrap .inp { border: none; box-shadow: none; padding-left: 0; }
.inp-wrap:focus-within { border-color: rgba(37,99,235,.5); box-shadow: 0 0 0 3px rgba(37,99,235,.08); }
.form-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
```

---

## Progress Bar

```css
.prog-bar  { height: 5px; background: var(--panel-bd); border-radius: 3px; overflow: hidden; }
.prog-fill { height: 100%; border-radius: 3px; transition: width .5s ease; }
/* Color: background: var(--green) | var(--amber) | var(--red) | var(--accent) */
```

---

## Page Tabs (segmented bar)

```css
.page-tabs { display: flex; align-items: center; gap: 2px; background: var(--card); border: 1px solid var(--card-bd); border-radius: 12px; padding: 5px; box-shadow: var(--sh-sm); width: fit-content; }
.pt-btn    { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 12.5px; font-weight: 600; color: var(--tx3); cursor: pointer; border: none; background: none; transition: all .14s; font-family: var(--sans); }
.pt-btn:hover  { color: var(--tx1); background: var(--panel-bd); }
.pt-btn.active { background: var(--royal); color: #fff; box-shadow: 0 2px 8px rgba(27,63,154,.25); }
.pt-btn i  { font-size: 15px; }
```

---

## Filter Chips

```css
.filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-chip  { padding: 6px 14px; border-radius: var(--r-full); border: 1.5px solid var(--card-bd); background: var(--card); cursor: pointer; font-size: 12px; font-weight: 600; color: var(--tx3); transition: all .14s; box-shadow: var(--sh-sm); font-family: var(--sans); }
.filter-chip:hover  { border-color: var(--royal); color: var(--royal); }
.filter-chip.active { background: var(--royal); color: #fff; border-color: var(--royal); box-shadow: 0 3px 10px rgba(27,63,154,.25); }
```

---

## Alert Callouts

```css
.callout         { display: flex; align-items: flex-start; gap: 12px; padding: 13px 16px; border-radius: var(--r-lg); }
.callout-info    { background: var(--royal-lt); border: 1.5px solid rgba(37,99,235,.18); border-left: 4px solid var(--royal); }
.callout-success { background: var(--green-lt);  border: 1.5px solid rgba(22,163,74,.2);  border-left: 4px solid var(--green); }
.callout-warn    { background: var(--amber-lt);  border: 1.5px solid rgba(217,119,6,.2);  border-left: 4px solid var(--amber); }
.callout-error   { background: var(--red-lt);    border: 1.5px solid rgba(220,38,38,.2);  border-left: 4px solid var(--red); }
.callout i { font-size: 17px; flex-shrink: 0; }
.callout-title { font-weight: 700; font-size: 13px; margin-bottom: 2px; }
.callout-msg   { font-size: 12.5px; }
```

---

## Modal

```css
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000; display: grid; place-items: center; backdrop-filter: blur(4px); opacity: 0; pointer-events: none; transition: opacity .2s; }
.modal-overlay.open { opacity: 1; pointer-events: all; }
.modal-box     { background: var(--card); border-radius: var(--r-2xl); box-shadow: var(--sh-xl); width: 480px; max-width: 94vw; max-height: 90vh; overflow: hidden; transform: translateY(12px); transition: transform .2s; }
.modal-overlay.open .modal-box { transform: translateY(0); }
.modal-hd      { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--card-bd); }
.modal-title   { font-size: 15px; font-weight: 700; color: var(--tx1); }
.modal-body    { padding: 20px; overflow-y: auto; }
.modal-ft      { padding: 14px 20px; border-top: 1px solid var(--card-bd); display: flex; gap: 8px; justify-content: flex-end; }
```

---

## GPS Widget

```css
.gps-widget   { background: var(--card); border: 1px solid var(--card-bd); border-radius: var(--r-xl); padding: 18px; box-shadow: var(--sh-sm); }
.gps-map-mock { height: 120px; border-radius: var(--r-lg); background: linear-gradient(135deg,#1a2f55 0%,#2563eb 100%); position: relative; overflow: hidden; margin-bottom: 14px; }
.gps-grid     { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px); background-size: 20px 20px; }
.gps-dot      { position: absolute; top: 50%; left: 50%; width: 14px; height: 14px; border-radius: 50%; background: var(--green); border: 2.5px solid #fff; transform: translate(-50%,-50%); box-shadow: 0 0 0 8px rgba(34,197,94,.2), 0 0 20px rgba(34,197,94,.4); }
.gps-ring     { position: absolute; top: 50%; left: 50%; width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid rgba(34,197,94,.4); transform: translate(-50%,-50%); animation: gps-pulse 2s ease-in-out infinite; }
@keyframes gps-pulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: .6; } 50% { transform: translate(-50%,-50%) scale(1.4); opacity: 0; } }
.gps-label-row { display: flex; align-items: center; justify-content: space-between; font-size: 12px; }
.gps-status   { display: flex; align-items: center; gap: 6px; font-weight: 600; color: var(--green); }
.gps-status::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--green); }
.gps-status.off     { color: var(--red); }
.gps-status.off::before { background: var(--red); }
.gps-coords   { font-family: var(--mono); font-size: 11px; color: var(--tx4); }
```

---

## Digital ID Card

```css
.id-card        { background: var(--card); border: 1px solid var(--card-bd); border-radius: var(--r-2xl); box-shadow: var(--sh-md); overflow: hidden; max-width: 300px; }
.id-card-banner { background: linear-gradient(135deg,#0F2347,#1B3F9A); padding: 18px 20px; display: flex; align-items: center; gap: 14px; }
.id-qr-area     { background: #fff; border-radius: 12px; padding: 12px; display: grid; place-items: center; }
.id-card-info   { padding: 14px 18px 16px; }
.id-meta-row    { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--tx3); padding: 4px 0; }
.id-meta-row i  { font-size: 13px; color: var(--tx4); }
.id-card-footer { padding: 10px 18px; background: var(--panel-bd); border-top: 1px solid var(--card-bd); display: flex; align-items: center; justify-content: space-between; }
```

---

## Toggle Switch

```css
.tog       { width: 36px; height: 20px; border-radius: var(--r-full); background: var(--panel-bd); position: relative; transition: background .2s; flex-shrink: 0; cursor: pointer; }
.tog.on    { background: var(--royal); }
.tog::after { content: ''; position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
.tog.on::after { transform: translateX(16px); }
```

---

## Avatar

```css
.av     { border-radius: 50%; display: grid; place-items: center; font-weight: 700; flex-shrink: 0; }
.av-sm  { width: 28px; height: 28px; font-size: 11px; }
.av-md  { width: 36px; height: 36px; font-size: 13px; }
.av-lg  { width: 44px; height: 44px; font-size: 16px; }
.av-xl  { width: 58px; height: 58px; font-size: 20px; }
```

---

## Action Icon Button

```css
.act-ico { width: 28px; height: 28px; border-radius: 6px; display: grid; place-items: center; cursor: pointer; border: 1px solid var(--card-bd); background: var(--card); color: var(--tx3); transition: all .14s; flex-shrink: 0; }
.act-ico:hover        { border-color: var(--royal); color: var(--royal); background: var(--royal-lt); }
.act-ico.danger:hover { border-color: var(--red);   color: var(--red);   background: var(--red-lt); }
.act-ico.green:hover  { border-color: var(--green);  color: var(--green); background: var(--green-lt); }
```

---

## Timeline

```css
.timeline   { display: flex; flex-direction: column; gap: 0; }
.tl-item    { display: flex; gap: 14px; padding: 12px 0; position: relative; }
.tl-item:not(:last-child)::after { content: ''; position: absolute; left: 14px; top: 36px; bottom: -12px; width: 1px; background: var(--panel-bd); }
.tl-dot     { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; }
.tl-dot i   { font-size: 14px; }
.tl-content { flex: 1; padding-top: 3px; }
.tl-title   { font-size: 13px; font-weight: 600; color: var(--tx1); }
.tl-time    { font-family: var(--mono); font-size: 11px; color: var(--tx4); }
.tl-desc    { font-size: 12.5px; color: var(--tx3); margin-top: 2px; }
```

---

## Pagination

```css
.pag     { display: flex; align-items: center; gap: 4px; }
.pag-btn { width: 30px; height: 30px; border-radius: var(--r-md); border: 1px solid var(--card-bd); background: var(--card); display: grid; place-items: center; cursor: pointer; font-size: 12px; font-weight: 600; color: var(--tx3); transition: all .14s; }
.pag-btn:hover  { border-color: var(--royal); color: var(--royal); }
.pag-btn.active { background: var(--royal); color: #fff; border-color: var(--royal); }
.pag-btn[disabled] { opacity: .4; cursor: not-allowed; }
```

---

## RBAC Permission Cell

```css
.perm-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.perm-row   { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--input-bg); border: 1px solid var(--card-bd); border-radius: var(--r-md); }
.perm-label { font-size: 12.5px; font-weight: 600; color: var(--tx2); }
.perm-row.granted   { border-color: rgba(22,163,74,.25);  background: var(--green-lt); }
.perm-row.denied    { border-color: rgba(220,38,38,.2);   background: var(--red-lt); }
.perm-row.partial   { border-color: rgba(217,119,6,.2);   background: var(--amber-lt); }
```

---

## Section Header label

```css
.section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--tx4); margin-bottom: 12px; }
```
