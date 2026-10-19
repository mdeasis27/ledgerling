# 12: READMEs and the definition-of-done check

**What to build:** `README.md` (EN) and `README.es.md` (ES), result first: the tool exactness score from `bun run eval` at the top and "Agent exactness: pending live grading"; how to run (demo, live with a key, the CLI scripts including `record-trace`); architecture in under 10 lines; 2-3 tradeoffs (text protocol vs native tools per ADR-0001, pre-formatted money per ADR-0002, income definition per ADR-0003); what didn't work. Then verify the full definition of done from `REQUIREMENTS.md` and commit.

**Blocked by:** 09, 11

**Status:** resolved

- [x] `bun install`, `build`, `test`, `typecheck`, `lint` all pass from a clean clone
- [x] `tool` and `eval` print valid JSON on the committed fixtures; `ask` prints the no-key error and exits 2 with no env vars
- [x] `bun run dev` serves `/en/app` and `/es/app` with no environment variables
- [x] README numbers match the actual `eval` output
- [x] Everything committed
