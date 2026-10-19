# 09: Live ask box in the web app

**What to build:** when the server has an LLM key, the Try it section shows an "Ask your own question" box that posts to `POST /api/ask`, runs the agent and renders the answer with its tool calls and results in the same layout as the trace replay, plus the provider badge. Without a key, the box is replaced by a short note that live mode needs a key, and `/api/ask` returns the live-mode error. Live asks are rate-limited per IP with ai-kit `rateLimit`; on a rate limit or provider failure the UI offers to go back to the demo traces. See grilling Q23, Q24.

**Blocked by:** 05, 08

**Status:** resolved

- [x] The page receives `liveAvailable` from the server; no key is needed to render
- [x] Route handler tested with keys cleared (error) and with an injected fake `chat` (success shape)
- [x] A rate-limited request gets a JSON error with a retry hint; the UI shows it in both locales
- [x] Only the real model reply is ever presented as a model answer
