# 08: Demo trace replay, placeholder trace and `record-trace`

**What to build:** `fixtures/demo-traces.json` ships with exactly one trace marked `"placeholder": true`: a real question, hand-written calls whose `result` is the real tool output, and an answer that plainly says it is a placeholder awaiting a recorded run. The Try it section lists example questions and replays a chosen trace step by step (question, each tool call with args and result, then the answer), with a visible "Placeholder, not a real model run" badge where it applies. `bun run record-trace "<question>"` (live only) runs the agent, appends a real trace with provider, model and timestamp, removes the placeholder once a real trace exists, and prints the appended trace JSON. See grilling Q18 to Q21.

**Blocked by:** 05, 06

**Status:** resolved

- [x] Type-guarded trace loader; an invalid file fails tests loudly and shows an empty state with a notice in the UI
- [x] Honesty test: every step of every trace is re-run against the fixture and deep-equals the stored result
- [x] Placeholder badge text exists in both locales and is visible without interaction
- [x] `record-trace` without a key prints the live-mode error and exits 2
- [x] Replay controls are buttons, keyboard operable, with visible focus
