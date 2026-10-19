# 03: Monthly summary and budget status

**What to build:** `monthly_summary` and `budget_status` work end to end through `runTool` and the `tool` CLI. Income is every positive amount in any category (ADR-0003); spend ignores positives; net = income - spend; a month with no rows returns zeros. Budget `over` is true only when spend > budget, and `remaining_cents` may be negative. See grilling Q3, Q6, Q7.

**Blocked by:** 01

**Status:** resolved

- [x] Strict `YYYY-MM` month validation (01..12)
- [x] `budget_cents` integer >= 0; unknown category is an error
- [x] A test pins Feb 2026 income at 629949 cents (refunds included) on the committed fixture
- [x] Every visible `monthly_summary` and `budget_status` case in `fixtures/tool-cases.json` matches
