# 02: List transactions and rank top merchants

**What to build:** `list_transactions` and `top_merchants` work end to end through `runTool` and the `tool` CLI, matching the exact contract: newest first with ties by CSV order, case-insensitive merchant substring of the description, `min_cents`/`max_cents` on the absolute amount, `limit` applied after sorting; merchants grouped by exact description, money out only, spend descending then description by plain code-unit order. See grilling Q7, Q9.

**Blocked by:** 01

**Status:** resolved

- [x] Items carry exactly `date, description, amount_cents, category, account`
- [x] `min_cents`/`max_cents`/`limit` are integers >= 0 and `n` an integer >= 1; fractions, negatives and numeric strings are errors; `min > max` gives an empty list
- [x] `n` larger than the number of merchants returns all of them
- [x] Tie-breaking verified with same-date rows and equal-spend merchants that differ only in case
- [x] Every visible `list_transactions` and `top_merchants` case in `fixtures/tool-cases.json` matches
