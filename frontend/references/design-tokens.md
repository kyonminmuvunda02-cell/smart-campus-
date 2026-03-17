# Smart Campus CUZ — Design Tokens

Single source of truth for all colors, typography, spacing, and shadows.
**Never introduce hex values not in this file.**

---

## Light mode CSS variables

```css
:root, [data-theme="light"] {
  /* ── Surfaces ── */
  --page:     #F0F4FA;   /* page background */
  --card:     #ffffff;   /* card / panel surface */
  --card-bd:  #DDE6F5;   /* card border */
  --panel-bd: #EBF0F9;   /* inner panel / row divider */
  --input-bg: #F6F9FF;   /* input field background */

  /* ── Text scale ── */
  --tx1: #0C1A35;   /* primary — headings */
  --tx2: #1A2F55;   /* secondary — body */
  --tx3: #4A5E80;   /* muted — captions */
  --tx4: #8FA3C0;   /* placeholder / hint */

  /* ── Brand ── */
  --royal:    #1B3F9A;   /* CUZ primary navy-blue */
  --royal-lt: #EEF3FF;   /* royal light tint */
  --royal-md: #DBEAFE;   /* royal medium tint */
  --accent:   #2563EB;   /* accent blue */
  --gold:     #C9920A;   /* sidebar active stripe */

  /* ── Semantic ── */
  --green:    #16A34A;  --green-lt:  #DCFCE7;  --green-md: #BBF7D0;
  --amber:    #D97706;  --amber-lt:  #FEF3C7;
  --red:      #DC2626;  --red-lt:    #FEE2E2;
  --purple:   #7C3AED;  --purple-lt: #F3E8FF;
  --teal:     #0891B2;  --teal-lt:   #ECFEFF;

  /* ── Shadows (blue-tinted) ── */
  --sh-xs:  0 1px 2px rgba(12,26,53,.05);
  --sh-sm:  0 1px 4px rgba(12,26,53,.06), 0 1px 2px rgba(12,26,53,.04);
  --sh-md:  0 4px 16px rgba(12,26,53,.09), 0 2px 6px rgba(12,26,53,.04);
  --sh-lg:  0 8px 28px rgba(12,26,53,.13), 0 2px 8px rgba(12,26,53,.05);
  --sh-xl:  0 20px 60px rgba(12,26,53,.18);
  --sh-hov: 0 8px 28px rgba(12,26,53,.13), 0 2px 8px rgba(12,26,53,.05);
  --sh-btn: 0 2px 8px rgba(27,63,154,.28);
  --sh-gold: 0 2px 8px rgba(201,146,10,.30);

  /* ── Typography ── */
  --sans: 'Sora', sans-serif;
  --mono: 'DM Mono', monospace;

  /* ── Layout ── */
  --sb-w:  224px;   /* sidebar width */
  --nav-h: 54px;    /* topbar height */

  /* ── Radius ── */
  --r-sm:   4px;
  --r-md:   7px;
  --r-lg:   10px;
  --r-xl:   14px;
  --r-2xl:  20px;
  --r-full: 999px;
}
```

---

## Dark mode CSS variables

```css
[data-theme="dark"] {
  --page:     #0D1525;
  --card:     #152035;
  --card-bd:  #1E3050;
  --panel-bd: #1A2B42;
  --input-bg: #111D30;

  --tx1: #E8EEFF;
  --tx2: #B8C8E8;
  --tx3: #7890B0;
  --tx4: #445870;

  --royal:    #3B6AE8;
  --royal-lt: #1A2B45;
  --royal-md: #1E3258;
  --accent:   #4F82F7;
  --gold:     #E8AA28;

  --green:    #22C55E;  --green-lt:  #0F2B1A;
  --amber:    #F59E0B;  --amber-lt:  #2A1F08;
  --red:      #F87171;  --red-lt:    #2A0F0F;
  --purple:   #A78BFA;  --purple-lt: #1E1530;
  --teal:     #22D3EE;  --teal-lt:   #0A2030;

  --sh-sm:  0 1px 4px rgba(0,0,0,.3),  0 1px 2px rgba(0,0,0,.2);
  --sh-md:  0 4px 16px rgba(0,0,0,.4), 0 2px 6px rgba(0,0,0,.25);
  --sh-lg:  0 8px 28px rgba(0,0,0,.5), 0 2px 8px rgba(0,0,0,.3);
  --sh-xl:  0 16px 48px rgba(0,0,0,.6);
  --sh-hov: 0 8px 28px rgba(0,0,0,.5), 0 2px 8px rgba(0,0,0,.3);
  --sh-btn: 0 2px 8px rgba(59,106,232,.35);
}
```

---

## Sidebar constants

```
Width:         224px (--sb-w)
Background:    #1B3F9A (light) / #0B1525 (dark)
Item padding:  7px 10px
Item margin:   1px 8px
Item radius:   6px
Icon size:     16px
Gold stripe:   2.5px, left edge, #C9920A
Section label: 10px uppercase, tracking 1px, rgba(255,255,255,.35)
Avatar:        28px circle
```

Active item: `rgba(255,255,255,.13)` bg + gold stripe  
Gold stripe glow: `0 0 8px rgba(201,146,10,.4)`

---

## Topbar constants

```
Height:     54px
Background: #ffffff (light) / #152035 (dark)
Border:     1px solid var(--card-bd)
Shadow:     var(--sh-sm)
Icon btn:   34×34px, radius 6px
Divider:    1px × 22px, var(--card-bd)
```

---

## Typography scale

| Role | Font | Weight | Size |
|------|------|--------|------|
| Page title | Sora | 800 | 22–24px |
| Section heading | Sora | 700 | 15–17px |
| Card title | Sora | 700 | 13.5–14px |
| Body / UI | Sora | 400–500 | 13px |
| Label / caption | Sora | 600 | 11–12.5px |
| Eyebrow / uppercase | Sora | 700 | 10–11px, tracking .8–1px |
| Numbers / stats | DM Mono | 500 | 24–46px |
| IDs / timestamps / coords | DM Mono | 400 | 11–12px |

**Rule**: ALL numeric values (attendance %, student IDs, timestamps, GPS coords, scan counts) use `font-family: var(--mono)`.

---

## Google Fonts + Icon CDN

```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" rel="stylesheet"/>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"/>
```

---

## Module color map

| Module type | Color token | Use case |
|-------------|-------------|----------|
| Attendance / Primary | `--royal` / `--accent` | Dashboard, stat cards |
| Verified / Present | `--green` | Success states |
| Warning / Late | `--amber` | Low attendance alerts |
| Admin / RBAC | `--purple` | Permissions, admin UI |
| GPS / Sessions | `--teal` | Location, live monitoring |
| Error / Absent | `--red` | Failures, suspensions |
