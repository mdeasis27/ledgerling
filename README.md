# Ledgerling

Ask your bank statement questions. An LLM answers only by calling typed tools that do all the math.

**Tool exactness: 100 / 100** (23 of 23 sample cases, `bun run eval`).
**Agent exactness: 87 / 100** (13 of 15 held-out questions answered correctly, live, Groq `qwen/qwen3.8-27b`).

Spanish version: [README.es.md](README.es.md). Design tokens and contrast ratios: [DESIGN.md](DESIGN.md).

## Run it

```bash
bun install
bun run dev          # http://localhost:3000/en/app and /es/app (set PORT to change), no env vars needed
bun run test         # bun test
bun run typecheck
bun run lint
bun run build
```

CLI scripts print one JSON document on stdout and nothing else:

```bash
bun run tool sum_by_category '{"from":"2026-01-01","to":"2026-01-31"}'   # --data <csv> to use another file
bun run eval                                                              # {"cases","exact_rate","score"}; --cases <json> --data <csv> --verbose
bun run ask "How much did I spend on groceries in March?"                 # live only
bun run record-trace "How much did I spend on groceries in March?"        # live only, appends a real demo trace
```

Live mode turns on when any of `GEMINI_API_KEY`, `GROQ_API_KEY` or `OPENROUTER_API_KEY` is set. Without a key, `ask` prints
`{"error":"live mode requires an LLM key"}` and exits 2, and the page shows the saved traces and the tool form.

## Architecture

1. `src/lib/ledger.ts` parses the CSV (quotes, CRLF, BOM) into transactions in integer cents.
2. `src/lib/tools.ts` holds the five tools and their validation. `runTool(name, args, ledger)` never throws.
3. `src/lib/eval.ts` scores tool cases by deep equality (`{"error":"*"}` matches any error).
4. `src/lib/agent.ts` runs the loop: the model replies with a JSON tool call or an answer, we run the tools, at most 6 rounds.
5. `ai-kit/` (vendored, untouched) supplies `chat()` and the rate limiter.
6. `src/app/[lang]/app` is the story page; `/api/tool` and `/api/ask` call the same engine as the CLI.
7. `fixtures/demo-traces.json` holds the replayable questions; a test re-runs every step against the tools.

## Tradeoffs

- **Text protocol, not native function calling** ([ADR-0001](docs/adr/0001-text-tool-call-protocol.md)). It works with every provider the router can pick and keeps ai-kit untouched, at the cost of an occasional malformed reply (one corrective retry).
- **Pre-formatted money for the model** ([ADR-0002](docs/adr/0002-preformatted-money-for-the-model.md)). Each tool result carries ready-made `$1,856.31` strings so the model quotes instead of converting cents.
- **Income is every positive amount** ([ADR-0003](docs/adr/0003-income-is-every-positive-amount.md)). Follows the brief literally, so refunds raise income and never lower spend.

## What didn't work

- The first plan put the agent behind native `tools`; ai-kit's Gemini path has none, so it would have needed a second code path.
- Google-hosted fonts at build time make offline builds fragile, so the fonts are committed and loaded locally.
- The agent misses multi-period totals: asked for April + May net cash flow, it reported each month and did not add them; asked for spend at one merchant, it listed the purchases without a total.
- Groq retired `llama-3.3-70b-versatile`, and `openai/gpt-oss-*` emits native tool calls the JSON-in-text protocol rejects, so the Groq model is `qwen/qwen3.8-27b`.

## Planning trail

Spec and tickets: `.scratch/ledgerling/`. Decisions: `docs/planning/grilling-log.md`. Vocabulary: `GLOSSARY.md`.
