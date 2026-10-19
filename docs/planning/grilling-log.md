# Grilling log: Ledgerling design

Produced by `/grill-with-docs` (grilling + domain-modeling) on 2026-10-16. No human was available,
so every question was answered with the recommended option. Each answer is a decision the spec and
tickets rely on. Facts were looked up in the repo (ai-kit source, fixtures), not asked.

Facts found before round 1:

- `ai-kit/router.ts` `chat()` takes `{ messages, maxTokens, temperature, signal, userApiKey }` and
  returns `{ text, provider, model, latency_ms }`. No tool calls. It tries Gemini, then Groq, then
  OpenRouter; with no key it throws `AllProvidersFailedError([])`.
- The Gemini provider lazily imports `@google/genai`, which is not a dependency; if only
  `GEMINI_API_KEY` is set and the SDK is missing, the provider throws a retryable error and the
  router moves on (or fails if no other key is set).
- `ai-kit/client.ts` re-exports `.tsx` React components; CLI code must import `ai-kit/router.ts`
  (and `errors.ts`) directly, not `client.ts`.
- `ai-kit/README.md` is stale (mentions pnpm, only OpenRouter); the code is the truth.
- Fixture: 151 rows, Jan to Mar 2026, accounts checking/credit/savings, no quoted fields in the
  visible CSV (hidden CSVs may have them). Merchants vary in case (`Starbucks`, `STARBUCKS`,
  `starbucks`). Two refunds are positive amounts in non-income categories (Feb).
- `tool-cases.json` monthly_summary 2026-01 and 2026-03 match "income = every positive amount";
  Feb (refunds) is not covered by a visible case.

---

## Round 1: foundations

**Q1 Tool-call mechanism.** Text protocol on top of `chat()` (model replies with JSON, we run the
tool and loop) or extend ai-kit with native `tools` for OpenAI-compatible providers?
- Answer: **text protocol** on top of `chat()`. Works for every provider in the router (Gemini is
  priority 1 and has no native-tools path in the kit), keeps ai-kit untouched (vendored), and is
  testable with a fake `chat`. Recorded as ADR-0001.

**Q2 Validation approach.** zod or hand-written validators?
- Answer: **hand-written** per-tool argument parsers returning `{ ok, value } | { error }`. The
  error contract is ours to shape, no dependency, and strict TS without `any` is easy.

**Q3 Income definition.** "income" = every positive amount (literal brief) or only the `income`
category?
- Answer: **every positive amount**, as the brief literally says. Scenario: Feb 2026 income is
  629,949 cents (includes two refunds), not 625,100. Spend never nets refunds. Recorded as ADR-0003.

**Q4 Known categories.** Validate `category` against `fixtures/categories.json` only, or also the
categories present in the loaded CSV?
- Answer: **union** of `categories.json` and categories seen in the loaded CSV. `pets` still errors
  on the visible data; a hidden CSV with a legit extra category does not break.

**Q5 Stack details.** Next.js version, styling, linter.
- Answer: latest stable Next.js App Router at implementation time (use `proxy.ts` if Next 16,
  `middleware.ts` if 15). **Plain CSS** with custom-property tokens + CSS Modules (no Tailwind).
  **Biome** as linter/formatter (`lint` = `biome check .`), with `noExplicitAny` as error.
  ai-kit files are excluded from Biome formatting rules but still typechecked.

---

## Round 2: tool semantics (unblocked by Q2, Q4)

**Q6 Date validation.** Regex only, or real calendar dates?
- Answer: strict `YYYY-MM-DD` **and** a real calendar date (`2026-02-30` is an error). Month is
  strict `YYYY-MM` with month 01..12. Comparison is lexicographic on the ISO string.

**Q7 Integer arguments.** Which args are integers and what bounds?
- Answer: `min_cents`, `max_cents`, `budget_cents`: integer >= 0. `limit`: integer >= 0 (0 gives
  an empty list). `n`: integer >= 1. A number with a fraction, a numeric string, NaN or a negative
  value is an error. `min_cents > max_cents` is not an error; it yields an empty list.

**Q8 Optional args given as null, and unknown keys.**
- Answer: an optional arg that is `null` or absent is treated as absent (LLMs emit `null` often).
  Unknown extra keys are ignored. Non-object `args` is an error. Missing required args are errors.
  `merchant` must be a string if present; empty string matches everything.

**Q9 Ordering rules.**
- Answer: `list_transactions` sorts by date descending, stable on CSV row index; `limit` applies
  after sorting. `top_merchants` sorts by spend descending, then description by plain code-unit
  comparison (`a < b`, never `localeCompare`). `by_category` key order is first-appearance (deep
  equality ignores it anyway).

**Q10 CSV parsing.**
- Answer: small RFC 4180 parser: quoted fields, `""` escapes, commas and newlines inside quotes,
  CRLF or LF, optional trailing newline, BOM stripped. Columns mapped by header name. A malformed
  row (bad date, non-integer amount, missing column) makes loading fail with a clear error, which
  the CLI prints as `{ "error": ... }`.

**Q11 Error messages.** Any wording?
- Answer: short human messages naming the field, e.g. `invalid date for "from": 2026-13-01`.
  Graded only as "an error string", but the agent reads them, so they must be actionable.

---

## Round 3: agent loop (unblocked by Q1, Q3)

**Q12 Protocol shape.**
- Answer: the system prompt lists every tool with its argument schema and asks the model to reply
  with exactly one JSON object: `{ "calls": [ { "name", "args" } ] }` to call tools, or
  `{ "answer": "..." }` to finish. Several calls in one reply count as **one round**. The parser
  tolerates code fences and leading prose (extracts the first balanced JSON object). An
  unparseable reply gets one corrective user message ("reply with JSON only"), which counts as a
  round.

**Q13 Round limit.**
- Answer: at most **6 tool rounds**. If the model still asks for tools after round 6, send a final
  message "no more tools; answer now from the results above" and accept its text as the answer.

**Q14 Money in the answer.** The model must not compute money, but turning cents into dollars is
computation.
- Answer: every tool result sent back to the model is the raw JSON **plus** a companion map of
  pre-formatted amounts (each `*_cents` field rendered by our formatter, e.g. `185631` ->
  `$1,856.31`). The prompt says: quote amounts exactly as given in the formatted map; never add,
  subtract or convert. The graded tool output itself is unchanged. Recorded as ADR-0002.

**Q15 Date context.** "How much in March?" needs a year.
- Answer: the system prompt states the date coverage of the loaded data (min and max date) and the
  category list, and says to assume the latest year covered when the year is missing.

**Q16 Model settings.**
- Answer: `temperature: 0`, `maxTokens: 800`. No BYOK in the UI (out of scope); env keys only.

**Q17 `ask` failure modes.**
- Answer: no key -> `{ "error": "live mode requires an LLM key" }`, exit 2. Provider failure ->
  `{ "error": "<message>" }`, exit 1. Success -> `{ "answer", "calls": [{ name, args }] }`, exit 0.
  Live = any of `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` non-empty.

---

## Round 4: demo mode and traces (unblocked by Q12)

**Q18 Trace file shape.**
- Answer: `fixtures/demo-traces.json` = `{ "traces": [ { id, question, placeholder, recorded_at?,
  provider?, model?, steps: [ { name, args, result } ], answer } ] }`. Loaded through a type guard;
  an invalid file is a loud error in tests and an empty list plus notice in the UI.

**Q19 Placeholder content.**
- Answer: exactly one trace with `"placeholder": true`. Its question is real, its steps are
  hand-written calls whose `result` is the real tool output (a test re-runs them), and its answer
  says plainly that it is a placeholder awaiting a recorded run. The UI shows a visible
  "Placeholder, not a real model run" badge. No invented model prose is presented as real.

**Q20 Recording traces.**
- Answer: ship an extra script `record-trace "<question>"` (live only) that runs the agent and
  appends a non-placeholder trace with provider/model/timestamp, and drops the placeholder once a
  real trace exists. Stdout is the appended trace JSON.

**Q21 Honesty test.**
- Answer: a test re-runs every step of every trace against the fixture and asserts the stored
  `result` deep-equals the live tool output. This catches stale traces after fixture changes.

**Q22 Direct tool form.**
- Answer: a form with a tool picker, per-tool labelled inputs and a "Run" button; it posts to a
  route handler that calls the same `runTool` used by the CLI and shows pretty JSON. Errors are
  shown as JSON too.

---

## Round 5: web app (unblocked by Q5, Q22)

**Q23 Where tools run in the web app.**
- Answer: on the server. A route handler `POST /api/tool` and a live-only `POST /api/ask`
  (rate-limited with ai-kit `rateLimit`, keyed by IP). The CSV is read from `fixtures/` at runtime
  with `outputFileTracingIncludes` so it ships with the deployment. The "Compare" section is a
  server component calling the tools at render.

**Q24 Live UI.**
- Answer: the page receives `liveAvailable` from the server. If live, an "Ask" box is shown next
  to the demo traces; if not, a short note says live mode needs a key. Demo always works.

**Q25 Compare section numbers.**
- Answer: computed at render, never hard-coded: (a) tool exactness from running the eval over
  `fixtures/tool-cases.json`, (b) a three-month table of income, spend and net from
  `monthly_summary`, (c) the fixture spend total vs. what a naive "sum every amount" would give
  (shows why refunds must not net). The agent number reads "pending live grading".

**Q26 Locales and routing.**
- Answer: one typed dictionary `Record<"en" | "es", Dict>`. Redirect rules in a pure function
  (testable) used by the proxy/middleware: no locale -> `/en` + path + query; `/{lang}` ->
  `/{lang}/app`; unknown first segment that looks like a locale code (2 letters) -> 404 via
  `notFound()`; `generateStaticParams` for `en`, `es` with `dynamicParams = false`.
  Static assets, `/api`, `_next` and `opengraph-image` are excluded from the redirect matcher.

**Q27 Money display.**
- Answer: one formatter from integer cents using integer division and modulo only (no float
  division), locale-aware separators (`en`: `$1,856.31`, `es`: `1.856,31 US$`). The agent prompt
  uses the `en` format.

**Q28 Identity.**
- Answer: "ledger paper" identity. Paper cream background, ink navy text, a deep teal accent and a
  muted brick red for "over budget". Fonts: Fraunces (wordmark, headings) and IBM Plex Sans/Mono
  (body, numbers). Wordmark: lowercase "ledgerling" in Fraunces with a small tick mark. Exact hexes
  and contrast ratios are fixed in DESIGN.md during the identity ticket, each pair >= 4.5:1.

---

## Round 6: CLI and quality (unblocked by Q10, Q17)

**Q29 `tool` CLI exit codes.**
- Answer: tool results (including `{ error }` from validation) exit 0; usage problems (missing
  name, invalid JSON args, unreadable `--data`) print `{ "error" }` and exit 1. Stdout is always
  exactly one JSON document.

**Q30 `eval` CLI.**
- Answer: prints exactly `{ cases, exact_rate, score }` with `exact_rate` in 0..1 and
  `score = exact_rate * 100`, unrounded. Flags `--cases <path>` and `--data <csv>` for hidden sets.
  `--verbose` writes failing case names to stderr only. Matching is structural deep equality, with
  `{ "error": "*" }` matching any object whose only key `error` is a string.

**Q31 Test seams.**
- Answer: highest seams only: `runTool(name, args, ledger)` for all tool semantics;
  `runAgent(question, { chat, ledger })` with an injected fake `chat`; the CLI scripts tested as
  subprocesses for stdout/exit codes; `resolveLocaleRedirect(url)` pure function; trace loader +
  honesty test; dictionary completeness enforced by the type system.

Frontier empty. Shared understanding reached (self-confirmed, no human available).
