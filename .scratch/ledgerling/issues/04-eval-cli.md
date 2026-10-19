# 04: Score tool exactness with `eval`

**What to build:** `bun run eval` scores `fixtures/tool-cases.json` against the ledger and prints exactly `{ "cases", "exact_rate", "score" }` (`score = exact_rate * 100`, unrounded). Matching is structural deep equality, with `{ "error": "*" }` matching any object whose only key is a string `error`. `--cases <path>` and `--data <csv>` swap inputs for hidden sets; `--verbose` lists failing case names on stderr only. See grilling Q30.

**Blocked by:** 02, 03

**Status:** resolved

- [x] On the committed fixtures the score is 100
- [x] The scorer is a reusable function (the web Compare section calls it) that also returns failures
- [x] Tests for the wildcard, key-order independence, array-order sensitivity and an unknown-tool case
- [x] Subprocess test: stdout parses as JSON with exactly the three keys
