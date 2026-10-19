# Tool calls via a JSON text protocol on top of chat()

ai-kit's `chat()` returns text only. We make the model reply with one JSON object (`{"calls":[...]}` or `{"answer":"..."}`), run the tools ourselves and loop, instead of extending ai-kit with native `tools`. The router's first provider (Gemini) has no native-tools path in the kit, ai-kit is vendored and should stay untouched, and a text protocol is trivially testable with a fake `chat`.

## Considered Options

- Native `tools` for OpenAI-compatible providers: better adherence on Groq/OpenRouter, but needs a fork of vendored code, a second path for Gemini, and different behaviour per provider.

## Consequences

- Malformed replies are possible; the loop extracts the first balanced JSON object, and spends one round on a corrective message when parsing fails.
