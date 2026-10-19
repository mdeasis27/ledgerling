# 05: Agent loop and the `ask` CLI

**What to build:** `bun run ask "<question>"` answers through tools when a key is set, printing `{ "answer", "calls": [{ name, args }] }`; without a key it prints `{ "error": "live mode requires an LLM key" }` and exits 2. The agent uses the JSON text protocol (ADR-0001): the model replies `{"calls":[...]}` or `{"answer":"..."}`, several calls per round are allowed, at most 6 rounds and then a forced final answer, one corrective message on an unparseable reply, tool errors fed back to the model. Tool results go back with a pre-formatted money companion map that the model must quote verbatim (ADR-0002). The system prompt includes the tool catalogue, the category list and the ledger's date coverage. `chat` is injected; production uses ai-kit's router. This slice also delivers the integer-only money formatter (`en`, `es`). See grilling Q12 to Q17 and Q27.

**Blocked by:** 02, 03

**Status:** resolved

- [x] `runAgent(question, { chat, ledger })` tested with a scripted fake `chat`: single call, multi-call round, code-fenced JSON, malformed reply recovery, tool error round trip, 6-round cap, provider failure
- [x] `liveAvailable(env)` is true iff any of `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` is non-empty
- [x] `ask` exit codes: 0 success, 1 provider failure (`{ error }`), 2 no key; stdout is one JSON document
- [x] Money formatter uses integer division and modulo only; tests for both locales, zero, negatives, large values
- [x] CLI and server code import ai-kit's router directly, never the `client.ts` barrel (it pulls React components)
