# Ledgerling

Hago preguntas a mi estado de cuenta. Un LLM responde solo llamando a herramientas tipadas que hacen todas las cuentas.

**Exactitud de herramientas: 100 / 100** (23 de 23 casos de muestra, `bun run eval`).
**Exactitud del agente: pendiente de evaluación en vivo.**

Versión en inglés: [README.md](README.md). Tokens de diseño y contrastes: [DESIGN.md](DESIGN.md).

## Cómo ejecutarlo

```bash
bun install
bun run dev          # http://localhost:3000/en/app y /es/app (PORT cambia el puerto), sin variables de entorno
bun run test         # bun test
bun run typecheck
bun run lint
bun run build
```

Los scripts de línea de comandos imprimen un único documento JSON en stdout y nada más:

```bash
bun run tool sum_by_category '{"from":"2026-01-01","to":"2026-01-31"}'   # --data <csv> para otro archivo
bun run eval                                                              # {"cases","exact_rate","score"}; --cases <json> --data <csv> --verbose
bun run ask "¿Cuánto gasté en supermercado en marzo?"                     # solo en vivo
bun run record-trace "¿Cuánto gasté en supermercado en marzo?"            # solo en vivo, agrega una traza real
```

El modo en vivo se activa cuando existe alguna de `GEMINI_API_KEY`, `GROQ_API_KEY` u `OPENROUTER_API_KEY`. Sin clave, `ask` imprime
`{"error":"live mode requires an LLM key"}` y sale con código 2, y la página muestra las trazas guardadas y el formulario de herramientas.

## Arquitectura

1. `src/lib/ledger.ts` lee el CSV (comillas, CRLF, BOM) y lo convierte en transacciones en centavos enteros.
2. `src/lib/tools.ts` contiene las cinco herramientas y su validación. `runTool(name, args, ledger)` nunca lanza.
3. `src/lib/eval.ts` puntúa casos por igualdad profunda (`{"error":"*"}` acepta cualquier error).
4. `src/lib/agent.ts` ejecuta el bucle: el modelo responde con una llamada JSON o una respuesta, ejecutamos las herramientas, máximo 6 rondas.
5. `ai-kit/` (incluido tal cual, sin cambios) aporta `chat()` y el limitador de uso.
6. `src/app/[lang]/app` es la página; `/api/tool` y `/api/ask` usan el mismo motor que la línea de comandos.
7. `fixtures/demo-traces.json` guarda las preguntas repetibles; una prueba vuelve a ejecutar cada paso contra las herramientas.

## Decisiones y costos

- **Protocolo de texto, no llamadas nativas** ([ADR-0001](docs/adr/0001-text-tool-call-protocol.md)). Funciona con cualquier proveedor que elija el router y deja ai-kit intacto, a cambio de alguna respuesta mal formada (un reintento correctivo).
- **Dinero preformateado para el modelo** ([ADR-0002](docs/adr/0002-preformatted-money-for-the-model.md)). Cada resultado trae textos como `$1,856.31` para que el modelo cite en vez de convertir centavos.
- **El ingreso es todo monto positivo** ([ADR-0003](docs/adr/0003-income-is-every-positive-amount.md)). Sigue el enunciado al pie de la letra: los reembolsos suben el ingreso y nunca bajan el gasto.

## Lo que no funcionó

- El primer plan usaba `tools` nativas; la ruta de Gemini en ai-kit no las tiene, así que habría hecho falta un segundo camino de código.
- Las fuentes alojadas por Google durante la compilación vuelven frágil la construcción sin red, así que las fuentes están en el repositorio y se cargan en local.
- Las trazas de ejemplo todavía no son ejecuciones reales de un modelo. La que se incluye es un marcador de posición etiquetado; ejecuta `record-trace` con una clave para reemplazarla.

## Rastro de planificación

Especificación y tickets: `.scratch/ledgerling/`. Decisiones: `docs/planning/grilling-log.md`. Vocabulario: `GLOSSARY.md`.
