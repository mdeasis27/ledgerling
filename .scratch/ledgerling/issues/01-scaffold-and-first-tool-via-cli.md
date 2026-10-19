# 01: Scaffold the project and run the first tool from the CLI

**What to build:** a fresh Bun + Next.js (App Router, TypeScript strict) project in this repo where `bun run tool sum_by_category '{"from":"2026-01-01","to":"2026-01-31"}'` prints the correct JSON from `fixtures/transactions.csv`. This slice lays the tool engine seam (`runTool(name, args, ledger)`), the ledger loader (quoted CSV fields, CRLF, BOM, header-mapped columns, category list ∪ categories seen in data), the shared argument validation (dates, ranges, categories, unknown tool) and the `tool` CLI with `--data`. All required scripts exist: `dev`, `build`, `test`, `typecheck` (`tsc --noEmit`), `lint` (Biome, `noExplicitAny` as error). ai-kit is typechecked as is and never edited. See grilling Q2, Q4, Q5, Q6, Q8, Q10, Q11, Q29 and ADR-0003.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `bun install`, `build`, `test`, `typecheck`, `lint` all pass; a placeholder page may exist, routing is not required yet
- [x] `sum_by_category` returns `{ by_category }` (zero-spend categories omitted) or `{ category, spend_cents }` (0 for a known category with no spend); refunds never reduce spend
- [x] `{ "error": string }` for bad or impossible dates, `from` after `to`, unknown category, unknown tool, non-object args, missing required args
- [x] `null` optional args treated as absent; unknown keys ignored
- [x] CSV loader handles `"Grocer, Co."`, `""` escapes, CRLF, BOM; malformed rows produce an error
- [x] `tool` CLI prints exactly one JSON document on stdout; usage errors (missing name, bad JSON, unreadable `--data`) print `{ error }` and exit 1; tool results exit 0
- [x] Tests at the `runTool` seam with inline CSV ledgers, and a subprocess test for the CLI
- [x] `@google/genai` added as a dependency so a Gemini-only live mode can work later
