---
name: smartcampus-frontend
description: Build, update, or style any CUZ Smart Campus Digital ID & Attendance Tracking System frontend UI — HTML/Bootstrap prototypes, standalone HTML files, or component-level code. Covers design tokens, typography, sidebar shell, topbar, stat cards, data tables, QR scan flow, GPS verification widget, digital ID card, role-based portals (Student, Lecturer, Admin), attendance status pills, session monitoring, RBAC roles & permissions pages, modals, forms, filters, pagination, timeline, dark mode (full surface map, all component overrides, system preference detection, localStorage persistence), and mobile view (responsive breakpoints, drawer sidebar, bottom nav, bottom-sheet modals, table scroll, stacked grids, touch targets, safe-area insets). Use this skill whenever the user asks to build, edit, or style any page or component for the Smart Campus / CUZ attendance system — even if they only mention one component, dark mode, or mobile layout, always load this skill first.
---

# Smart Campus CUZ — Frontend Skill

## When to use
Load this skill for **any** of the following:
- Creating or updating HTML prototypes for the Smart Campus system
- Building any page: student portal, lecturer portal, admin panel, or QR scan flow
- Adding new components consistent with the CUZ design system
- Generating design specs, token references, or component patterns
- Implementing dark mode or accessibility improvements
- Building role/permissions management UI

## Reference files (load as needed)

| File | Load when… |
|------|-----------|
| `references/design-tokens.md` | **Always load first** — colors, typography, shadows, spacing, radius |
| `references/components.md` | Buttons, pills, cards, tables, inputs, modals, toggles, pagination, timeline, GPS widget, QR ID card |
| `references/page-patterns.md` | Full shell layout, page header, all page layouts by role |
| `references/screens.md` | QR scan flow, digital ID card, GPS verify, role/permissions, session monitor |
| `references/dark-mode.md` | Full dark mode — CSS variables, all component overrides, toggle, localStorage, system preference |
| `references/mobile-view.md` | Responsive breakpoints, drawer sidebar, bottom nav, stacked grids, table scroll, bottom-sheet modals, touch targets |

**Always load `references/design-tokens.md` first.**  
**For dark mode tasks** → load `references/dark-mode.md` immediately after tokens.  
**For mobile/responsive tasks** → load `references/mobile-view.md` immediately after tokens.

---

## Tech variant — Standalone HTML

Single `.html` file; all styles and scripts inline.
- Fonts: **Sora** (400–800) + **DM Mono** (400/500)
- Icons: `@tabler/icons-webfont` — prefix every icon `ti ti-{name}`
- CSS framework: **Bootstrap 5.3** (CDN)

```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" rel="stylesheet"/>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"/>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
```

---

## System overview

**CUZ Smart Campus** is a web-based attendance tracking system for Cavendish University Zambia. It uses:
- **QR Code** digital identity verification (refreshes every 30 sec)
- **GPS geofencing** to confirm on-campus presence (50m radius)
- **RBAC** — three roles: Student, Lecturer, Admin
- **Fraud prevention** — proxy attendance blocked by QR + GPS combo
- **Real-time session monitoring** for lecturers and administrators

---

## Complete page catalog

### Student Portal
| Page | Key components |
|------|---------------|
| Dashboard | Stat row (4), attendance table, GPS widget, today's timeline |
| My Digital ID | QR ID card, GPS status, how-it-works timeline |
| My Attendance | Per-module table with progress bars, warning callouts |
| Schedule | Weekly timetable (coming soon pattern) |
| Modules | Enrolled module cards |

### Lecturer Portal
| Page | Key components |
|------|---------------|
| Lecturer Dashboard | Live session stat cards, class list |
| Start Session | Module selector, GPS lock, QR generation, live scan feed |
| Session Detail | Scanned/absent counts, progress bar, live table |
| Attendance History | Filter by module/date, export |

### Admin Portal
| Page | Key components |
|------|---------------|
| Admin Dashboard | System-wide stats, at-risk alerts |
| Student Management | Admin table, bulk import, search/filter, pagination |
| Lecturer Management | Lecturer table, module assignment |
| Live Sessions | Session cards with live/ended status |
| Reports & Analytics | Chart placeholders, export PDF |
| Roles & Permissions | RBAC grid, role cards, permission toggles |
| Settings | Profile form, security, notification toggles |

### Auth Pages
| Page | Key components |
|------|---------------|
| Login | Role selector, email/password, branding banner |
| Forgot Password | Email input, confirmation callout |

---

## Uniform page header — ALL pages must use this

```html
<div class="page-hd">
  <div class="ph-left">
    <div class="ph-icon"><i class="ti ti-{icon}"></i></div>
    <div>
      <div class="ph-title">Page Title</div>
      <div class="ph-sub">Subtitle / description</div>
    </div>
  </div>
  <div class="ph-actions">
    <button class="btn btn-outline btn-sm"><i class="ti ti-…"></i>Secondary</button>
    <button class="btn btn-primary btn-sm"><i class="ti ti-…"></i>Primary</button>
  </div>
</div>
```

Icon variants:
- **Default**: `background:var(--royal-lt)`, icon `color:var(--royal)`
- **Gradient** (dashboards): `background:linear-gradient(135deg,var(--royal),var(--accent))`; icon white
- **Teal** (GPS/sessions): `background:var(--teal-lt)`; icon `color:var(--teal)`
- **Green** (success/confirmed): `background:var(--green-lt)`; icon `color:var(--green)`

---

## Status badge quick reference

| Status | Class | Usage |
|--------|-------|-------|
| Present | `pill-present` | green-lt bg |
| Absent | `pill-absent` | red-lt bg |
| Late | `pill-late` | amber-lt bg |
| Excused | `pill-excused` | purple-lt bg |
| Active Session | `pill-green` | live scan |
| GPS Verified | `pill-teal` | on campus |
| RBAC Verified | `pill-royal` | identity ok |
| Warning | `pill-amber` | low attendance |
| Suspended | `pill-red` | account locked |
| Student | `pill-student` | teal |
| Lecturer | `pill-lecturer` | royal |
| Admin | `pill-admin` | purple |

---

## Core design principles

1. **Never introduce new hex values** — all colors from `design-tokens.md`
2. **Navy sidebar** — `#1B3F9A` bg, gold active stripe `#C9920A`, white text
3. **Blue-tinted shadows only in light mode** — pure black rgba in dark mode
4. **Dark mode = distinct layered surfaces** — 4 depth layers, never inverted light mode
5. **Typography is intentional** — Sora/DM Mono only; mono for all numbers, dates, IDs
6. **Status = color + icon + label** — never raw booleans or plain text
7. **QR codes refresh every 30 sec** — always show countdown or expiry notice
8. **GPS widget always shows** animated pulse ring when active
9. **Mobile-first layout** — sidebar becomes drawer at ≤ 768px, bottom nav replaces sidebar nav
10. **Touch targets ≥ 44×44px** on mobile — never smaller interactive elements

---

## Domain / module color system

| Domain | Token | Hex |
|--------|-------|-----|
| Attendance | blue/royal | `#2563EB` |
| Verified/Present | green | `#16A34A` |
| Warning/Late | amber | `#D97706` |
| Admin/RBAC | purple | `#7C3AED` |
| GPS/Sessions | teal | `#0891B2` |
| Absent/Error | red | `#DC2626` |

---

## Quality checklist

### General
- [ ] All colors from CSS variables — no stray hex values
- [ ] Numbers, IDs, timestamps: `DM Mono` font
- [ ] Headings: Sora 700–800
- [ ] Interactive elements: hover + focus states
- [ ] Status: always pill badges — never raw strings
- [ ] Page header: `page-hd / ph-left / ph-icon / ph-title / ph-sub / ph-actions`
- [ ] QR code: 30-sec countdown present
- [ ] GPS widget: animated ring when verifying

### Dark mode
- [ ] Page bg: `#0D1525`, cards: `#152035`, inputs: `#111D30`
- [ ] Sidebar: `#0B1525`, active stripe `#E8AA28` with glow
- [ ] Shadows: pure black rgba (not blue-tinted)
- [ ] `.btn-outline` darkened surface override applied
- [ ] All 9 pill variants legible on `#152035` card bg
- [ ] System preference respected on load (no flash)
- [ ] `localStorage` saves preference across sessions
- [ ] FAB shows sun in dark, moon in light

### Mobile
- [ ] Sidebar becomes drawer at ≤ 768px (hamburger + overlay)
- [ ] Bottom nav visible at ≤ 768px — 4–5 key items
- [ ] Bottom nav uses `env(safe-area-inset-bottom)`
- [ ] Stat rows: 2-col at ≤ 768px
- [ ] All two-column grids collapse to 1-col at ≤ 768px
- [ ] Data tables wrapped in `.table-scroll`
- [ ] Modals become bottom sheets at ≤ 480px
- [ ] Filter chips scroll horizontally on mobile
- [ ] All tap targets ≥ 44×44px
- [ ] Content bottom padding = 100px (bottom nav clearance)

---

## Workflow

1. Identify the target page and role (Student / Lecturer / Admin / Auth)
2. Load `references/design-tokens.md`
3. Find page in catalog → load `references/page-patterns.md`
4. For QR, GPS, or RBAC pages → load `references/screens.md`
5. For components → load `references/components.md`
6. **If dark mode required** → load `references/dark-mode.md` and apply all overrides
7. **If mobile/responsive required** → load `references/mobile-view.md` and apply responsive CSS block
8. Build using token set and component patterns
9. Run quality checklist (General + Dark mode + Mobile sections)
