# Smart Campus CUZ — Dark Mode

Dark mode uses **distinct layered surfaces** — never inverted light mode. Every surface has a unique depth layer so UI hierarchy is preserved in the dark.

---

## Full CSS variable block

Always place this immediately after the light-mode `:root` block.

```css
[data-theme="dark"] {
  /* ── Surfaces (layered — never pure black) ── */
  --page:     #0D1525;   /* layer 0 — outermost background */
  --card:     #152035;   /* layer 1 — cards, panels */
  --card-bd:  #1E3050;   /* card borders */
  --panel-bd: #1A2B42;   /* inner panel borders, row dividers */
  --input-bg: #111D30;   /* layer 2 — inputs, deeper insets */

  /* ── Text ── */
  --tx1: #E8EEFF;   /* primary */
  --tx2: #B8C8E8;   /* secondary */
  --tx3: #7890B0;   /* muted */
  --tx4: #445870;   /* placeholder */

  /* ── Brand ── */
  --royal:    #3B6AE8;
  --royal-lt: #1A2B45;
  --royal-md: #1E3258;
  --accent:   #4F82F7;
  --gold:     #E8AA28;

  /* ── Semantic ── */
  --green:    #22C55E;  --green-lt:  #0F2B1A;  --green-md: #133D22;
  --amber:    #F59E0B;  --amber-lt:  #2A1F08;
  --red:      #F87171;  --red-lt:    #2A0F0F;
  --purple:   #A78BFA;  --purple-lt: #1E1530;
  --teal:     #22D3EE;  --teal-lt:   #0A2030;

  /* ── Shadows (deeper, pure black — no blue tint in dark) ── */
  --sh-xs:  0 1px 2px rgba(0,0,0,.25);
  --sh-sm:  0 1px 4px rgba(0,0,0,.3),   0 1px 2px rgba(0,0,0,.2);
  --sh-md:  0 4px 16px rgba(0,0,0,.4),  0 2px 6px rgba(0,0,0,.25);
  --sh-lg:  0 8px 28px rgba(0,0,0,.5),  0 2px 8px rgba(0,0,0,.3);
  --sh-xl:  0 16px 48px rgba(0,0,0,.6);
  --sh-hov: 0 8px 28px rgba(0,0,0,.5),  0 2px 8px rgba(0,0,0,.3);
  --sh-btn: 0 2px 8px rgba(59,106,232,.35);
  --sh-gold: 0 0 20px rgba(232,170,40,.25), 0 4px 16px rgba(232,170,40,.15);
}
```

---

## Surface layer map

| Layer | Element | Light | Dark |
|-------|---------|-------|------|
| 0 | Page background | `#F0F4FA` | `#0D1525` |
| 1 | Cards / modals | `#ffffff` | `#152035` |
| 1.5 | Inner panel / row divider | `#EBF0F9` | `#1A2B42` |
| 2 | Input fields / insets | `#F6F9FF` | `#111D30` |
| — | Card borders | `#DDE6F5` | `#1E3050` |

**Rule**: Each layer must be visibly distinct. Never use the same hex for two levels.

---

## Toggle — FAB button (bottom-right)

```html
<button class="theme-toggle-fab" id="themeToggle" title="Toggle dark mode">
  <i class="ti ti-moon" id="themeIcon"></i>
</button>
```

```css
.theme-toggle-fab {
  position: fixed; bottom: 24px; right: 24px; z-index: 999;
  width: 42px; height: 42px; border-radius: 50%;
  background: var(--royal); color: #fff; border: none;
  cursor: pointer; display: grid; place-items: center;
  box-shadow: var(--sh-md); transition: all .18s;
}
.theme-toggle-fab:hover { background: var(--accent); transform: scale(1.08); }
.theme-toggle-fab i { font-size: 20px; }
```

```js
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');

// Restore saved preference on load
const saved = localStorage.getItem('cuz-theme') || 'light';
document.documentElement.setAttribute('data-theme', saved);
themeIcon.className = saved === 'dark' ? 'ti ti-sun' : 'ti ti-moon';

themeToggle.addEventListener('click', () => {
  const html   = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  const next   = isDark ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  themeIcon.className = next === 'dark' ? 'ti ti-sun' : 'ti ti-moon';
  localStorage.setItem('cuz-theme', next);
});
```

---

## Toggle — Topbar icon button (alternative)

Use inside `.topbar` instead of FAB when mobile nav is active.

```html
<button class="tb-btn" id="themeToggle" title="Toggle theme">
  <i class="ti ti-moon" id="themeIcon" style="font-size:16px"></i>
</button>
```

---

## System preference detection (auto dark on load)

Add before closing `</head>` — runs before paint to avoid flash:

```html
<script>
  (function() {
    const saved = localStorage.getItem('cuz-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
</script>
```

---

## Sidebar — dark overrides

```css
[data-theme="dark"] .sidebar            { background: #0B1525; }
[data-theme="dark"] .sb-brand           { border-color: rgba(255,255,255,.08); }
[data-theme="dark"] .sb-item.active::before {
  background: #E8AA28;
  box-shadow: 0 0 8px rgba(232,170,40,.55);
}
/* Mobile drawer dark */
[data-theme="dark"] .sb-overlay         { background: rgba(0,0,0,.7); }
```

---

## Topbar — dark overrides

```css
[data-theme="dark"] .topbar             { background: #152035; }
[data-theme="dark"] .tb-search input    { background: #111D30; color: var(--tx1); }
[data-theme="dark"] .tb-btn             { background: #1A2B42; border-color: #1E3050; }
```

---

## Cards — dark overrides

No extra CSS needed. All card backgrounds use `var(--card)` which auto-switches.

Border uses `var(--card-bd)` — also auto-switches.

**Exception — ID card banner**: The gradient `linear-gradient(135deg,#0F2347,#1B3F9A)` works in both modes because it's already dark. No override needed.

---

## Data table — dark overrides

```css
[data-theme="dark"] .data-table th        { background: #1A2B42; }
[data-theme="dark"] .data-table tbody tr:hover td { background: var(--royal-lt); }
```

---

## Buttons — dark mode behavior

Primary and semantic buttons (`.btn-primary`, `.btn-green`, `.btn-danger`) work without overrides — they use solid brand colors.

Outline button needs border darkening:
```css
[data-theme="dark"] .btn-outline {
  background: #1A2B42;
  border-color: var(--card-bd);
  color: var(--tx2);
}
[data-theme="dark"] .btn-outline:hover {
  border-color: var(--royal);
  color: var(--accent);
  background: var(--royal-lt);
}
```

---

## Status pills — dark mode

Pill light-token backgrounds (`--green-lt`, `--amber-lt`, etc.) auto-switch to dark tints via variables. No override needed.

Verify contrast ratios visually:
- `--green` on `--green-lt` (dark): `#22C55E` on `#0F2B1A` ✓
- `--amber` on `--amber-lt` (dark): `#F59E0B` on `#2A1F08` ✓
- `--red` on `--red-lt` (dark): `#F87171` on `#2A0F0F` ✓
- `--royal` on `--royal-lt` (dark): `#3B6AE8` on `#1A2B45` ✓

---

## Inputs — dark overrides

```css
[data-theme="dark"] .inp {
  background: var(--input-bg);
  border-color: var(--card-bd);
  color: var(--tx1);
}
[data-theme="dark"] .inp-wrap {
  background: var(--input-bg);
  border-color: var(--card-bd);
}
[data-theme="dark"] .inp:focus,
[data-theme="dark"] .inp-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(79,130,247,.12);
}
```

---

## Modal — dark override

```css
[data-theme="dark"] .modal-overlay { background: rgba(0,0,0,.65); }
[data-theme="dark"] .modal-box     { background: var(--card); }
```

---

## GPS widget — dark mode

The map mock gradient stays `linear-gradient(135deg,#1a2f55,#2563eb)` — works in both modes (it's dark already).

GPS dot and ring colors use `var(--green)` / `var(--red)` which auto-brighten in dark (`#22C55E` / `#F87171`).

---

## Alert callouts — dark mode

All callout backgrounds use semantic tokens that auto-switch. The border-left accent colors (`var(--royal)`, `var(--green)`, etc.) are brighter in dark mode.

No overrides needed — verify visually that border-left is visible on dark card surface.

---

## Toggle switch — dark override

```css
[data-theme="dark"] .tog     { background: #1A2B42; border: 1px solid var(--card-bd); }
[data-theme="dark"] .tog.on  { background: var(--royal); border-color: transparent; }
```

---

## Pagination — dark override

```css
[data-theme="dark"] .pag-btn { background: #1A2B42; border-color: var(--card-bd); color: var(--tx3); }
[data-theme="dark"] .pag-btn:hover { border-color: var(--royal); color: var(--accent); }
```

---

## Section label — dark

Auto-switches via `var(--tx4)`. No override needed.

---

## Login page — dark panel

Right brand panel `linear-gradient(135deg,#0F2347,#1B3F9A,#2563EB)` — unchanged in dark. Left form panel uses `var(--card)`.

```css
[data-theme="dark"] .login-form-panel {
  background: var(--card);
  border-right-color: var(--card-bd);
}
```

---

## Permission grid — dark overrides

```css
[data-theme="dark"] .perm-row         { background: var(--input-bg); border-color: var(--card-bd); }
[data-theme="dark"] .perm-row.granted { background: var(--green-lt); border-color: rgba(34,197,94,.2); }
[data-theme="dark"] .perm-row.denied  { background: var(--red-lt);   border-color: rgba(248,113,113,.15); }
[data-theme="dark"] .perm-row.partial { background: var(--amber-lt); border-color: rgba(245,158,11,.2); }
```

---

## Smooth theme transition

Add to `body` or `*` to prevent jarring flash on toggle:

```css
*, *::before, *::after {
  transition: background-color .2s ease, border-color .2s ease, color .15s ease;
}
/* Exclude transitions that would look wrong */
.btn, .pill, .gps-ring { transition: all .14s; }
```

---

## Dark mode quality checklist

- [ ] `data-theme="dark"` on `<html>` renders correct surfaces at all 4 layers
- [ ] Sidebar: `#0B1525` bg, `#E8AA28` active stripe with glow
- [ ] Topbar: `#152035` bg
- [ ] Cards: `#152035` bg, `#1E3050` borders
- [ ] Inputs: `#111D30` bg
- [ ] Shadows: pure black rgba (no blue tint)
- [ ] Buttons: `.btn-outline` darkened surface
- [ ] Pills: all 9 variants legible on dark card bg
- [ ] GPS widget: green/red dot/ring visible on dark map
- [ ] Modals: overlay `rgba(0,0,0,.65)`, box `#152035`
- [ ] Toggles: off-state visible on dark bg
- [ ] System preference respected on first load (no flash)
- [ ] `localStorage` preference persists across page loads
- [ ] Theme FAB icon: sun in dark mode, moon in light mode
