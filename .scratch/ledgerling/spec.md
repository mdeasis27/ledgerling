# Spec: Ledgerling, ask your bank statement questions, answered by tools

**Status:** resolved

Sources: `REQUIREMENTS.md` (authoritative), `docs/planning/grilling-log.md` (decisions Q1..Q31),
`GLOSSARY.md` (vocabulary), `docs/adr/` (ADR-0001 text protocol, ADR-0002 pre-formatted money,
ADR-0003 income definition).

## Problem Statement

I have a bank statement as a CSV and simple questions about it: how much did I spend on groceries
in March, where does my money go, am I over my dining budget. Spreadsheets are tedious, and
asking a chatbot is worse: it does arithmetic in its head and gets money wrong, confidently. I want
to ask in plain words and get an answer whose every figure was computed by code I can check.

As the portfolio maintainer, I also need the project to run with no keys at all (public demo),
to be graded deterministically on its tools, and to never present invented model output as real.

## Solution

A small set of typed **tools** over the **ledger** does all the math in integer **cents**. An LLM
agent answers questions only by calling those tools through a JSON text protocol on top of
ai-kit's `chat()`, for at most six **rounds**, and quotes amounts pre-formatted by our code.

Three surfaces share one tool engine:

- **CLI**: `tool` (run one tool), `ask` (live agent), `eval` (tool exactness score), plus
  `record-trace` (maintainer records real demo traces).
- **Web app** (`/{lang}/app`, `en` and `es`): a story page whose "Try it" section offers trace
  replay and a direct tool form in **demo mode**, and an ask box in **live mode**.
- **Docs**: README (EN/ES) leading with the tool exactness number, DESIGN.md with the identity.

## User Stories

Tools and data

1. As a user, I want to get my spend per category for a date range, so that I see where my money went.
2. As a user, I want to get the spend of one category for a range, so that I answer "how much on groceries".
3. As a user, I want a known category with no spend to return 0, so that "nothing" is an answer, not an error.
4. As a user, I want categories with zero spend omitted from the breakdown, so that the breakdown stays short.
5. As a user, I want refunds never to reduce spend, so that spend means what I paid out.
6. As a user, I want to list transactions newest first, so that I see recent activity first.
7. As a user, I want same-day transactions to keep file order, so that results are stable and predictable.
8. As a user, I want to filter transactions by category, merchant text, minimum and maximum absolute amount, so that I find specific purchases.
9. As a user, I want the merchant filter to ignore case, so that "starbucks" finds "STARBUCKS".
10. As a user, I want a `limit` applied after sorting, so that "last 5" means the 5 newest.
11. As a user, I want the top N merchants by spend, so that I see who gets most of my money.
12. As a user, I want merchants grouped by exact description, so that grouping never guesses.
13. As a user, I want spend ties broken by description in plain code-unit order, so that ranking is deterministic.
14. As a user, I want a monthly summary of income, spend and net, so that I know if I saved money.
15. As a user, I want income to include every money-in amount (refunds too), so that it matches the definition I was given.
16. As a user, I want a month with no data to return zeros, so that empty months are not errors.
17. As a user, I want a budget status for a category and month, so that I know my remaining room.
18. As a user, I want `over` true only when spend strictly exceeds the budget, so that hitting the budget exactly is fine.
19. As a user, I want negative `remaining_cents` when I overspend, so that I see by how much.
20. As a user, I want invalid input (bad date, from after to, bad month, unknown category or tool, non-integer or negative amounts, n < 1) to return `{ error }`, so that mistakes are explained, not crashed on.
21. As a user, I want impossible calendar dates like 2026-02-30 rejected, so that typos don't silently match nothing.
22. As a user, I want quoted CSV fields with commas to parse correctly, so that "Grocer, Co." is one merchant.
23. As a user, I want date ranges inclusive at both ends, so that a single-day range works.
24. As a grader, I want any CSV in the same format to work, so that hidden cases score fairly.
25. As a grader, I want categories present in a hidden CSV accepted even if missing from the list file, so that valid data never errors.

CLI

26. As a grader, I want `tool <name> <json-args>` to print exactly the tool's JSON, so that I can diff it.
27. As a grader, I want `--data <csv>` to swap the ledger, so that I can run hidden CSVs.
28. As a grader, I want `eval` to print `{ cases, exact_rate, score }`, so that I get one number.
29. As a grader, I want `eval --cases` and `--data`, so that hidden case files run without code changes.
30. As a grader, I want `{ "error": "*" }` to match any error string, so that wording is free.
31. As a maintainer, I want `eval --verbose` to list failures on stderr, so that stdout stays pure JSON.
32. As a maintainer, I want `ask "<question>"` to print `{ answer, calls }`, so that I can grade agent answers.
33. As a visitor without a key, I want `ask` to print the live-mode error and exit 2, so that the failure is explicit.
34. As a maintainer, I want `record-trace "<question>"` to append a real trace to the demo file, so that the demo shows genuine runs.
35. As a maintainer, I want all CLI scripts to print only JSON on stdout, so that they compose with other tools.

Agent

36. As a user, I want the agent to answer only through tool calls, so that every figure is computed.
37. As a user, I want the answer to cite the numbers the tools returned, so that I can check it.
38. As a user, I want amounts quoted in formatted dollars produced by code, so that the model never converts money.
39. As a user, I want "March" to mean the March in my data, so that I don't need to type the year.
40. As a user, I want the agent to stop after at most six rounds, so that it never loops forever.
41. As a user, I want the agent to recover from one malformed model reply, so that a small format slip doesn't fail the question.
42. As a user, I want tool errors fed back to the model, so that it can fix its arguments.
43. As a user, I want several tool calls allowed in one round, so that comparisons fit the round budget.

Web app: demo and live

44. As a visitor, I want the page to work with no environment variables, so that the demo never breaks.
45. As a visitor, I want to replay example questions step by step (question, calls, results, answer), so that I see how the agent thinks with tools.
46. As a visitor, I want placeholder traces visibly labelled, so that I'm never misled about real model output.
47. As a visitor, I want to call any tool from a form and see the JSON, so that I can verify the math myself.
48. As a visitor, I want tool errors shown as JSON in the form, so that I see the validation contract.
49. As a visitor with a deployment that has a key, I want to ask my own question, so that I see the live agent.
50. As the maintainer, I want live asks rate-limited per IP, so that the free quota survives.
51. As a visitor, I want amounts displayed with my locale's separators, so that numbers read naturally.

Web app: story page, i18n, routing

52. As a visitor, I want `/` and locale-less paths to redirect to `/en…` keeping the query, so that links always land.
53. As a visitor, I want `/{lang}` to redirect to `/{lang}/app`, so that the short URL works.
54. As a visitor, I want unknown locales to 404, so that bad URLs are honest.
55. As a Spanish reader, I want every string in Spanish, so that I can use the whole page.
56. As a developer, I want a missing translation to be a type error, so that it can't ship.
57. As a visitor, I want an EN/ES switch, so that I can change language on the same page.
58. As a visitor, I want a "← All projects" link top-left, so that I can return to the portfolio.
59. As a visitor, I want a hero, an analogy with a short glossary, Try it, Compare, Where it fits, What it proves, so that the page tells a story in order.
60. As a visitor, I want the Compare numbers computed by the product, so that they are real.
61. As an engineer, I want a collapsed "For engineers" section with the mechanism, tests, stack line and repo link, so that I can dig in.
62. As someone sharing the link, I want an Open Graph image per locale, so that previews look right.
63. As a keyboard user, I want every control reachable with visible focus and labels, so that I can use the page.
64. As a phone user, I want the page to work at 375 px, so that I can use it on mobile.
65. As a visitor, I want a distinct identity (palette, type, wordmark), so that the project feels its own.

Docs and quality

66. As a reviewer, I want README.md and README.es.md to open with the tool exactness number and "agent: pending live grading", so that the result comes first.
67. As a reviewer, I want DESIGN.md to list tokens and each text/background contrast ratio, so that accessibility is checkable.
68. As a maintainer, I want `install`, `build`, `test`, `typecheck`, `lint` green, so that the project is done-done.
69. As a maintainer, I want a test that re-runs every trace step and compares results, so that traces never drift from the tools.

## Implementation Decisions

Modules (deep, small interfaces):

- **Ledger loader**: parses CSV text into an ordered list of transactions (RFC 4180 subset: quotes,
  `""` escape, CRLF/LF, BOM, header-mapped columns). Validates every row; failure is an error
  value, not a throw at the boundary. Also loads the category list. Interface:
  `loadLedger(csvText, categories) -> Ledger | { error }`. The ledger knows its rows, its known
  categories (list file ∪ seen in data) and its date coverage.
- **Tool engine** (the main seam): `runTool(name, args: unknown, ledger) -> JsonValue`. Owns
  argument parsing per tool (hand-written parsers, null treated as absent, unknown keys ignored),
  the five tool implementations and the error contract. Also exports a tool catalogue (names,
  argument descriptions) used by the agent prompt and the UI form.
- **Money formatter**: integer cents to display string via integer division/modulo, locale `en`
  or `es`. Used by UI and by the agent's pre-formatted companion map.
- **Eval scorer**: `scoreCases(cases, ledger) -> { cases, exact_rate, score, failures }`;
  structural deep equality with the `{ "error": "*" }` wildcard. The CLI prints only the first
  three keys.
- **Agent**: `runAgent(question, { chat, ledger, maxRounds = 6 }) -> { answer, calls, steps,
  provider?, model? } | { error }`. `chat` is injected (ai-kit `chat` from `ai-kit/router.ts` in
  production, a scripted fake in tests). Protocol per ADR-0001; feedback format per ADR-0002;
  temperature 0; system prompt includes tool catalogue, category list and ledger date coverage.
  `liveAvailable(env)` checks the three key variables.
- **Trace store**: type-guarded loader for the demo trace file, and an append function used by
  `record-trace`. Trace shape: `{ id, question, placeholder, recorded_at?, provider?, model?,
  steps: [{ name, args, result }], answer }` inside `{ traces: [...] }`.
- **CLI scripts** (Bun, TypeScript): `tool`, `ask`, `eval`, `record-trace`. Thin wrappers that
  print one JSON document on stdout. Exit codes: `tool` 0 for tool results incl. validation
  errors, 1 for usage errors; `ask` 0 / 1 provider failure / 2 no key; `eval` 0.
- **i18n**: one typed dictionary `Record<"en" | "es", Dict>`; locale helpers; pure
  `resolveLocaleRedirect(pathname, search)` used by the Next proxy/middleware.
- **Web app** (Next.js App Router, latest stable): `[lang]` segment with static params `en`, `es`
  and `dynamicParams = false`; story page sections in the mandated order; route handlers
  `POST /api/tool` (always) and `POST /api/ask` (live only, ai-kit `rateLimit` per IP);
  server-side ledger read from `fixtures/` with output file tracing includes; `opengraph-image`
  per locale.
- **Identity**: CSS custom-property tokens (paper cream, ink navy, deep teal, brick red), fonts
  Fraunces + IBM Plex Sans/Mono via `next/font/google`, a text wordmark. CSS Modules, no Tailwind.
- **Tooling**: Bun, TypeScript strict, Biome lint (`noExplicitAny` error), `typecheck` =
  `tsc --noEmit`. ai-kit is imported only via `router.ts`/`errors.ts`/`rate-limit.ts`, never the
  barrel `client.ts` from server/CLI code.

Tool contract (exact, from the brief, with resolved edges):

- Dates `YYYY-MM-DD`, real calendar dates; months `YYYY-MM`, 01..12; ranges inclusive; `from > to`
  is an error.
- `min_cents`, `max_cents`, `budget_cents`, `limit` integers >= 0; `n` integer >= 1. `min > max`
  gives an empty list, not an error.
- Spend = sum of |negative amounts|; income = sum of positive amounts in any category (ADR-0003).
- `list_transactions`: date desc, stable by CSV index, limit after sort; items carry exactly
  `date, description, amount_cents, category, account`.
- `top_merchants`: money out only, group by exact description, spend desc then description by
  code-unit order.
- `budget_status.over` iff spend > budget; `remaining = budget - spend`.

## Testing Decisions

- A good test drives a public seam with realistic input and asserts on the observable output
  (JSON, stdout, exit code, HTTP redirect target), never on internals.
- Seams, highest first (grilling Q31):
  - `runTool` with small inline CSV ledgers, one describe per tool, covering every rule in the
    contract above (ties, case-insensitive merchant, refunds, empty months, zero-spend category,
    each error class), plus the full visible `tool-cases.json` through the scorer (must be 100%).
  - Ledger loader with quoted fields, CRLF, BOM, malformed rows.
  - Money formatter for both locales, negatives, zero, large values.
  - `runAgent` with a scripted fake `chat`: single call, multi-call round, code-fenced JSON,
    malformed reply recovery, tool error fed back, round cap at 6 with forced answer, provider
    failure.
  - CLI scripts as subprocesses (`bun run …`): stdout parses as JSON, exit codes, `--data`,
    `ask` without keys exits 2 (env cleared).
  - Trace loader + honesty test (every trace step re-run equals stored result; exactly the
    placeholder rule holds).
  - `resolveLocaleRedirect` table tests; route handlers called directly with `Request` objects.
- No prior art in the repo (greenfield); `bun test` throughout.
- Dictionary completeness is enforced by `tsc`, not by tests.

## Out of Scope

- Uploading a user's own CSV in the web UI (CLI `--data` covers hidden data).
- BYOK key input in the UI, streaming answers, chat history across questions.
- Native function calling or edits to `ai-kit/`.
- Currency other than a single display currency; multi-currency ledgers.
- Recording the real demo traces (maintainer does it later with `record-trace` and a key).
- Persisting anything server-side beyond in-memory rate limiting.

## Further Notes

- The agent exactness number is graded later by the maintainer; README says "pending live grading".
- If only `GEMINI_API_KEY` is set, ai-kit's Gemini provider needs `@google/genai` installed;
  add it as a dependency so a Gemini-only live mode works.
- Copy rules: first person, plain words, no em dashes, no brand or company names in UI copy
  (fixture merchant names appear only as data in tool output, not in copy).
