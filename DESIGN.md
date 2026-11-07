# DESIGN.md — ahmedsaiyed.site

Direction: **engineering spec sheet**. A single 768px column framed by hairline rails,
full-bleed horizontal rules between sections, hatched separators, monospace metadata.
Quiet, dense, real. Layout inspired by yash14.com (credited in the footer); all code,
copy and artwork here are original.

## Tokens
| Token | Dark | Light |
|---|---|---|
| `--bg` | `#0a0a0b` | `#fafaf9` |
| `--fg` | `#f4f4f5` | `#18181b` |
| `--muted` | `#a1a1aa` | `#52525b` |
| `--line` | `#27272a` | `#e4e4e7` |
| `--chip` | `#18181b` | `#f4f4f5` |
| `--ok` (status only) | `#34d399` | `#059669` |

- Fonts: **Geist** (UI/body), **Geist Mono** (metadata, chips, labels).
- Radius: 6px chips/buttons, 999px avatar/status pill. Nothing else rounded.
- Spacing: 4px base; section padding 24px x 16px (mobile) / 32px x 24px.

## Motion
- Signature moment: canvas CI/CD conveyor in the cover (`fx.js`). Commits ride a belt through
  build → test → scan → deploy gates; ~20% fail tests and ~12% fail the scan, turn red and drop off;
  the rest ship to prod. Live log + shipped/rejected counters.
- Entrance stagger, letter-by-letter name, typed tagline, scroll reveal, count-up stats,
  smooth accordions, cursor spotlight, footer wordmark with a light that follows the cursor.
- Brand logos (Simple Icons, CC0, `assets/icons/`) are masked to brand colour at 1em beside skills.
- Full motion by default; the nav toggle stores `motion=reduced` in localStorage to opt out.

## Banned
Purple/blue gradients, emoji icons, fake badges/metrics, glow effects, cards in cards,
fake contact forms (contact is a real `mailto:`).
