import { rateLimit } from "../../ai-kit/rate-limit";
import type { ChatFn } from "./agent";
import { liveAvailable, runAgent } from "./agent";
import type { JsonObject } from "./json";
import { loadLedgerFile } from "./ledger-files";
import { runTool } from "./tools";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** POST /api/tool: { name, args } -> the tool's JSON. Validation errors are 200 { error }. */
export async function handleTool(request: Request): Promise<Response> {
  const body = await readBody(request);
  if (!body || typeof body.name !== "string") {
    return json({ error: 'body must be { "name": string, "args": object }' }, 400);
  }
  const ledger = loadLedgerFile();
  if ("error" in ledger) return json({ error: ledger.error }, 500);
  const result: JsonObject = runTool(body.name, body.args ?? {}, ledger);
  return json(result);
}

export type AskDeps = {
  chat: ChatFn;
  env?: Record<string, string | undefined>;
  limit?: { maxRequests: number; windowMs: number };
};

/** POST /api/ask: { question } -> agent answer. Live mode only. */
export async function handleAsk(request: Request, deps: AskDeps): Promise<Response> {
  if (!liveAvailable(deps.env ?? process.env)) {
    return json({ error: "live mode requires an LLM key" }, 503);
  }
  const body = await readBody(request);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (question === "" || question.length > 500) {
    return json({ error: "question must be 1 to 500 characters" }, 400);
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const limited = rateLimit(
    `ask:${ip}`,
    deps.limit ?? { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  );
  if (!limited.allowed) {
    return json(
      { error: "rate limit exceeded", retryAfterSeconds: limited.retryAfterSeconds },
      429,
    );
  }
  const ledger = loadLedgerFile();
  if ("error" in ledger) return json({ error: ledger.error }, 500);
  const result = await runAgent(question, { chat: deps.chat, ledger });
  if ("error" in result) return json({ error: result.error }, 502);
  return json(result);
}
