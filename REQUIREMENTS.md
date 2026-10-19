# Ledgerling: ask your bank statement questions, answered by tools

Slug: `ledgerling`. A personal-finance agent. The user asks in plain language ("How much did
I spend on groceries in March?") and an LLM answers **only by calling typed tools** over
the user's transactions. The tools do all the math; the model never computes money itself.

## 1. Data

`fixtures/transactions.csv`: `date,description,amount_cents,category,account`.
- `amount_cents`: negative = money out, positive = money in. Integer.
- `category` is one of the values in `fixtures/categories.json`.
- Dates are `YYYY-MM-DD`. All date ranges are inclusive on both ends.

## 2. Tools (exact contract, graded)

Every tool takes one JSON object and returns JSON. "spend" means the sum of the absolute
values of negative amounts; "income" the sum of positive amounts.

| Tool | Args | Returns |
|---|---|---|
| `sum_by_category` | `{ from, to, category? }` | `{ by_category: { [category]: spend_cents } }`, or `{ category, spend_cents }` when `category` is given. Categories with zero spend are omitted. |
| `list_transactions` | `{ from, to, category?, merchant?, min_cents?, max_cents?, limit? }` | `{ transactions: [...] }`, newest first, ties by CSV order. `merchant` is a case-insensitive substring of `description`. `min_cents`/`max_cents` filter on the absolute amount. |
| `top_merchants` | `{ from, to, n }` | `{ merchants: [{ description, spend_cents }] }` by spend descending, ties by description ascending; only money out. |
| `monthly_summary` | `{ month: "YYYY-MM" }` | `{ month, income_cents, spend_cents, net_cents }` |
| `budget_status` | `{ category, month, budget_cents }` | `{ category, month, spend_cents, remaining_cents, over: boolean }` (`remaining_cents` may be negative) |

Invalid args (bad date, `from` after `to`, bad month, unknown category or tool, non-integer
or negative amounts, `n` < 1) return `{ "error": "<message>" }`.

Precise semantics:
- Spend ignores positive amounts entirely (a refund does not net against spend).
- `sum_by_category` with a known `category` and no spend returns `spend_cents: 0`.
- `top_merchants` groups by the exact `description` string (case-sensitive); ties sort by
  plain code-unit comparison. Only `list_transactions`' `merchant` filter is case-insensitive.
- `list_transactions` items are `{ date, description, amount_cents, category, account }`;
  `limit` applies after sorting.
- `budget_status.over` is true only when spend is strictly greater than the budget.
- `fixtures/categories.json` is an array of category strings. CSV fields may be quoted
  (`"Grocer, Co."`).
- In `tool-cases.json`, `expected: { "error": "*" }` matches any `{ "error": string }`.

## 3. Agent

- Function calling over the tools above. `ai-kit`'s `chat()` returns text only, with no
  native tool calls: either add a small tool-call protocol on top of it (the model replies
  with a JSON tool call, you run it and loop) or extend `ai-kit` with native `tools` for
  the OpenAI-compatible providers. Your choice; document it. At most 6 tool rounds per
  question. The final answer cites the numbers the tools returned.
- Live mode only when one of the `ai-kit` keys is set.
- **Demo mode:** a few example questions replay recorded traces (question → tool calls →
  tool results → answer) from `fixtures/demo-traces.json`. The maintainer records the real
  traces from a live run later: ship the loader, the UI replay and a file containing
  **one clearly marked placeholder trace** (`"placeholder": true`) that the UI labels as
  such. Never invent model output and present it as real.
- In demo mode the user can also call any tool directly from a form and see the JSON.

## 4. CLI scripts

| Script | Must do |
|---|---|
| `tool <name> <json-args>` | Runs one tool on `fixtures/transactions.csv`; prints its JSON. `--data <csv>` overrides the file. |
| `ask "<question>"` | Live only: runs the agent, prints `{ "answer": string, "calls": [{ name, args }] }`. Without the key, prints `{ "error": "live mode requires an LLM key" }` and exits 2. |
| `eval` | Scores `fixtures/tool-cases.json` (each case: `{ name, args, expected }`, deep-equal) and prints `{ "cases", "exact_rate", "score" }`, `score` = exact_rate × 100. |

## 5. Graded number

- **Tool exactness** on hidden tool cases (same format, other CSVs). Deterministic.
- **Agent exactness**, graded by the maintainer with a live key: share of hidden questions
  whose answer contains the gold figure.

The README reports the tool number, and the agent number as "pending live grading".

## Constants (identical in every tanda 1 brief)

### Stack (fixed)
- Bun as package manager and runtime. Next.js App Router. TypeScript strict, no `any`, no
  `@ts-ignore`. Tests with `bun test`. Linter of your choice.
- Money is integer cents, never floats.
- Required scripts: `dev`, `build`, `test`, `typecheck` (`tsc --noEmit`), `lint`, plus the
  project-specific CLI scripts in its brief. CLI scripts print JSON on stdout and nothing else.

### Demo mode (portfolio rule)
- The app must work fully with **no environment variables**: every external service (LLM,
  email, payments, analytics) has a demo path that uses committed fixtures.
- Optional live mode only when its env var is set. Never required for the page, the tests
  or the CLI scripts.
- If this project uses an LLM, `ai-kit/` (already in the repo, treat it as vendored) is
  the client: its `chat()` router (`ai-kit/router.ts`) falls back across free providers and
  is live when any of `GEMINI_API_KEY`, `GROQ_API_KEY` or `OPENROUTER_API_KEY` is set;
  `demo-mode.ts` has the demo helpers. Read the code, not only its README.

### Routes and portfolio integration
- Locales `en` (default) and `es`. Every visible string exists in both, from one typed
  dictionary (`Record<"en" | "es", …>`) so a missing translation is a type error.
- `/` and any path without a locale redirect to `/en…`, keeping the query string. An
  unknown locale returns 404. `/{lang}` redirects to `/{lang}/app`.
- `/{lang}/app` is the product page. At its top-left, a link
  `https://portafolio-mdea.vercel.app/{lang}/projects` reading `← All projects` /
  `← Todos los proyectos`. A language switch EN/ES.
- `/{lang}/app` is a story page, sections in this order: hero (name, one-liner, chips);
  an analogy paragraph with a 3–5 term mini-glossary; "Try it" (the working product);
  "Compare" (real numbers computed by the product, never hard-coded); "Where it fits"
  (worth it when / not needed when); "What it proves" (first person).
- Last, a native collapsed `<details>` titled "For engineers" / "Para
  ingenieros": the mechanism (algorithm, thresholds), how it is tested, a `Stack: …` line,
  and a link to `https://github.com/mdeasis27/<slug>`.
- `opengraph-image` (Next file convention) per locale with the product name and one-liner.
- Copy rules: first person, plain words, no em dashes, no brand or company names in UI copy.

### Identity (its own, not a shared design system)
- Its own palette, typography (Google Fonts via `next/font` or self-hosted) and a wordmark.
  Defined as CSS tokens in this repo and documented in `DESIGN.md` at the root, with the
  contrast ratio of each text/background pair (WCAG AA minimum).
- Works at 375 px wide. Keyboard accessible, visible focus, labelled controls, one `h1`.

### Docs
- `README.md` (EN) and `README.es.md` (ES), result first: the graded number at the top,
  how to run, architecture in under 10 lines, 2–3 tradeoffs, what didn't work.

### Definition of done
1. `bun install`, `build`, `test`, `typecheck` and `lint` all pass.
2. Every CLI script in the brief runs on the committed fixtures and prints valid JSON.
3. `bun run dev` serves `/en/app` and `/es/app`, working with no environment variables.
4. `README.md`, `README.es.md` and `DESIGN.md` exist as described.
5. Everything is committed to git in this repository.

The grader also runs the CLI scripts against **hidden cases** in the same format. Make the
logic general; don't fit it to the visible fixtures.
