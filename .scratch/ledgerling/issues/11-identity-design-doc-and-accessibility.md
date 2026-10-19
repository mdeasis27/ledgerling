# 11: Identity finish, DESIGN.md and accessibility pass

**What to build:** the "ledger paper" identity is finished and documented. `DESIGN.md` at the root lists every CSS token (colours, type scale, spacing, radius, focus ring), the fonts and why, the wordmark, and the WCAG contrast ratio of each text/background pair actually used (all at least AA). The whole page passes a keyboard and 375 px check: visible focus everywhere, labelled controls, one `h1`, no horizontal scroll. See grilling Q28.

**Blocked by:** 07, 08, 10

**Status:** resolved

- [x] Contrast ratios are computed (not guessed) for each pair and recorded in DESIGN.md
- [x] The brick red "over budget" text meets AA on its background
- [x] Tab order follows the story order; `<details>` is reachable and toggles by keyboard
- [x] No layout overflow at 375 px in either locale
