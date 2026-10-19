# Ledgerling design

Identity: "ledger paper". Warm cream paper, navy ink, a deep teal accent and a brick red for
anything that went over or needs care. It should feel like a well kept account book, not a dashboard.

Tokens live in `src/app/globals.css` (`:root`). Ratios below come from `bun scripts/contrast.ts`
(WCAG 2.x relative luminance). AA needs 4.5:1 for body text and 3:1 for large text and UI borders.

## Colour tokens

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F6F1E4` | page background |
| `--card` | `#FFFDF7` | cards, inputs, tables |
| `--sand` | `#E9E0C8` | chips, code blocks, badges |
| `--ink` | `#1B2A41` | body text, headings |
| `--muted` | `#4A5568` | labels, notes |
| `--teal` | `#0F5C5C` | links, buttons, wordmark, focus ring |
| `--brick` | `#9B3324` | "over" figures, alerts, placeholder badge |
| `--rule` | `#8A7F62` | borders of inputs and cards |

## Contrast of each text and background pair in use

| Pair | Ratio | Result |
|---|---|---|
| ink on paper | 12.81 | AA, AAA |
| ink on card | 14.20 | AA, AAA |
| ink on sand (code blocks) | 10.98 | AA, AAA |
| muted on paper | 6.67 | AA |
| muted on card | 7.40 | AA |
| muted on sand | 5.72 | AA |
| teal on paper (links, wordmark) | 6.88 | AA |
| teal on card | 7.63 | AA |
| teal on sand (badge) | 5.90 | AA |
| paper on teal (buttons, active language) | 6.88 | AA |
| brick on paper (alerts) | 6.44 | AA |
| brick on card (over figure) | 7.14 | AA |
| brick on sand | 5.52 | AA |
| rule on paper (border, non-text) | 3.52 | AA for UI components (3:1) |

## Type

- Display: Fraunces 600, for the wordmark and headings. Self-hosted TTF through `next/font/local`
  so the build never needs the network.
- Body: IBM Plex Sans 400 and 600.
- Numbers and JSON: IBM Plex Mono 400. Money columns use it so digits line up.
- Scale: h1 `clamp(2.4rem, 9vw, 3.6rem)`, h2 1.7rem, h3 1.2rem, body 1rem, line height 1.55.

## Spacing, shape, focus

- Spacing steps: 0.25, 0.5, 1, 1.5, 2.5 rem. Content width 46rem.
- Radius 4px. Cards have a 1px `--rule` border, no shadows.
- Focus: 3px solid teal outline with a 2px offset on every focusable element (`:focus-visible`).
- Touch targets: inputs, selects and buttons are at least 2.75rem tall.

## Wordmark

Lowercase "ledgerling" in Fraunces with a square-capped check mark before it, in teal. The check
mark is inline SVG with `aria-hidden`, so the accessible name is just the word. The Open Graph
image repeats the mark on the paper background.

## Responsive and accessibility notes

- Single column down to 375px; tables scroll inside `.table-wrap`, long text wraps (`overflow-wrap: anywhere`).
- One `h1` per page. Every control has a visible `<label>`. Results and answers sit in `aria-live`
  regions. Scrollable code blocks are keyboard focusable.
- The placeholder trace badge uses text plus a brick border, never colour alone.
