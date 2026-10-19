import type { ChatOptions, ChatResponse, Message } from "../../ai-kit/types";
import type { Json, JsonObject } from "./json";
import type { Ledger } from "./ledger";
import { formatMoneyFields } from "./money";
import { runTool, TOOL_CATALOGUE, type ToolName } from "./tools";

export type ChatFn = (opts: ChatOptions) => Promise<ChatResponse>;
export type ToolCall = { name: string; args: unknown };
export type AgentStep = { name: string; args: unknown; result: JsonObject };
export type AgentResult = {
  answer: string;
  calls: ToolCall[];
  steps: AgentStep[];
  provider?: string;
  model?: string;
};

export const MAX_ROUNDS = 6;

/** Live mode is on when any ai-kit key is set. */
export function liveAvailable(env: Record<string, string | undefined> = process.env): boolean {
  return ["GEMINI_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY"].some((k) => {
    const v = env[k];
    return typeof v === "string" && v.trim() !== "";
  });
}

export function buildSystemPrompt(ledger: Ledger): string {
  const tools = (Object.keys(TOOL_CATALOGUE) as ToolName[])
    .map((name) => {
      const t = TOOL_CATALOGUE[name];
      const args = t.args
        .map((a) => `${a.name}${a.required ? "" : "?"} (${a.kind}: ${a.description})`)
        .join("; ");
      return `- ${name}: ${t.description} Args: ${args}`;
    })
    .join("\n");
  const cov = ledger.coverage
    ? `The transactions cover ${ledger.coverage.from} to ${ledger.coverage.to}. If the user gives a month without a year, use the latest year covered.`
    : "The ledger is empty.";
  return [
    "You answer questions about a person's bank transactions. You can only get facts by calling tools. Never compute, add, subtract or convert money yourself.",
    "",
    "Tools:",
    tools,
    "",
    `Categories: ${ledger.categories.join(", ")}.`,
    cov,
    "Amounts are integer cents (negative = money out). 'Spend' ignores money in.",
    "",
    "Reply with exactly one JSON object and nothing else.",
    'To call tools: {"calls":[{"name":"<tool>","args":{...}}]} (several calls are allowed in one reply).',
    'To finish: {"answer":"<your answer>"}.',
    `You may use tools for at most ${MAX_ROUNDS} rounds.`,
    "Each tool result comes with a 'formatted' map holding the amounts as ready-made text. Quote those strings exactly in your answer. Never do arithmetic on them.",
    "Cite the numbers the tools returned in your final answer.",
  ].join("\n");
}

/** Finds the first balanced JSON object in text (tolerates fences and prose). */
export function extractJsonObject(text: string): unknown {
  for (let start = text.indexOf("{"); start >= 0; start = text.indexOf("{", start + 1)) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < text.length; i += 1) {
      const ch = text[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') inString = false;
      } else if (ch === '"') inString = true;
      else if (ch === "{") depth += 1;
      else if (ch === "}") {
        depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(text.slice(start, i + 1));
          } catch {
            break;
          }
        }
      }
    }
  }
  return undefined;
}

type Reply =
  | { kind: "answer"; answer: string }
  | { kind: "calls"; calls: ToolCall[] }
  | { kind: "invalid" };

export function parseReply(text: string): Reply {
  const obj = extractJsonObject(text);
  if (typeof obj !== "object" || obj === null) return { kind: "invalid" };
  if ("calls" in obj && Array.isArray(obj.calls)) {
    const calls: ToolCall[] = [];
    for (const c of obj.calls as unknown[]) {
      if (typeof c !== "object" || c === null || !("name" in c) || typeof c.name !== "string") {
        return { kind: "invalid" };
      }
      calls.push({ name: c.name, args: "args" in c ? c.args : {} });
    }
    if (calls.length > 0) return { kind: "calls", calls };
  }
  if ("answer" in obj && typeof obj.answer === "string")
    return { kind: "answer", answer: obj.answer };
  return { kind: "invalid" };
}

type Options = { chat: ChatFn; ledger: Ledger; maxRounds?: number };

export async function runAgent(
  question: string,
  opts: Options,
): Promise<AgentResult | { error: string }> {
  const maxRounds = opts.maxRounds ?? MAX_ROUNDS;
  const messages: Message[] = [
    { role: "system", content: buildSystemPrompt(opts.ledger) },
    { role: "user", content: question },
  ];
  const calls: ToolCall[] = [];
  const steps: AgentStep[] = [];
  let provider: string | undefined;
  let model: string | undefined;
  let corrected = false;

  const ask = async (): Promise<string> => {
    const res = await opts.chat({ messages, temperature: 0, maxTokens: 800 });
    provider = res.provider;
    model = res.model;
    messages.push({ role: "assistant", content: res.text });
    return res.text;
  };
  const done = (answer: string): AgentResult => ({ answer, calls, steps, provider, model });

  try {
    for (let round = 0; round < maxRounds; round += 1) {
      const text = await ask();
      const reply = parseReply(text);
      if (reply.kind === "answer") return done(reply.answer);
      if (reply.kind === "invalid") {
        if (corrected) return done(text.trim());
        corrected = true;
        messages.push({
          role: "user",
          content: 'Reply with JSON only: {"calls":[...]} or {"answer":"..."}.',
        });
        continue;
      }
      const results: Json[] = [];
      for (const c of reply.calls) {
        const result = runTool(c.name, c.args, opts.ledger);
        calls.push({ name: c.name, args: c.args });
        steps.push({ name: c.name, args: c.args, result });
        results.push({ name: c.name, result, formatted: formatMoneyFields(result, "en") });
      }
      messages.push({ role: "user", content: `Tool results:\n${JSON.stringify(results)}` });
    }
    messages.push({
      role: "user",
      content: 'No more tools. Answer now from the results above. Reply {"answer":"..."}.',
    });
    const text = await ask();
    const final = parseReply(text);
    return done(final.kind === "answer" ? final.answer : text.trim());
  } catch (e) {
    return { error: e instanceof Error ? e.message : "agent failed" };
  }
}
