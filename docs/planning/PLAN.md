# Implementation plan

Workflow: `/setup-matt-pocock-skills` (local markdown tracker) -> `/grill-with-docs` (self-answered,
no human available) -> `/to-spec` -> `/to-tickets`. Every approval was granted by default; every
question took the recommended answer.

- Spec: `.scratch/ledgerling/spec.md`
- Tickets: `.scratch/ledgerling/issues/01..12`
- Decisions: `docs/planning/grilling-log.md` (Q1..Q31), `docs/adr/0001..0003`
- Vocabulary: `GLOSSARY.md`

## Ticket order and blocking edges

| # | Ticket | Blocked by |
|---|---|---|
| 01 | Scaffold + first tool via CLI | none |
| 02 | list_transactions + top_merchants | 01 |
| 03 | monthly_summary + budget_status | 01 |
| 04 | eval CLI | 02, 03 |
| 05 | Agent loop + ask CLI | 02, 03 |
| 06 | Locale routing + story page shell | 01 |
| 07 | Direct tool form | 02, 03, 06 |
| 08 | Demo trace replay + record-trace | 05, 06 |
| 09 | Live ask in the web app | 05, 08 |
| 10 | Compare + story content + OG images | 04, 06 |
| 11 | Identity finish, DESIGN.md, a11y | 07, 08, 10 |
| 12 | READMEs + definition of done | 09, 11 |

Work the frontier: any ticket whose blockers are all done. Linear fallback: 01..12 in order.
Implementation should follow `/tdd` at the seams listed in the spec's Testing Decisions.
