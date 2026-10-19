import { describe, expect, test } from "bun:test";
import type { ChatOptions, ChatResponse } from "../ai-kit/types";
import { extractJsonObject, liveAvailable, runAgent } from "../src/lib/agent";
import { loadLedger } from "../src/lib/ledger";

const ledgerOrErr = loadLedger(
  "date,description,amount_cents,category,account\n2026-03-02,Shop,-1234,groceries,checking\n",
  ["groceries"],
);
if ("error" in ledgerOrErr) throw new Error(ledgerOrErr.error);
const ledger = ledgerOrErr;

function scripted(replies: string[]) {
  const seen: ChatOptions[] = [];
  let i = 0;
  const chat = async (opts: ChatOptions): Promise<ChatResponse> => {
    seen.push({ ...opts, messages: [...opts.messages] });
    const text = replies[Math.min(i, replies.length - 1)] ?? "";
    i += 1;
    return { text, provider: "fake", model: "fake-1", latency_ms: 1 };
  };
  return { chat, seen };
}

const CALL =
  '{"calls":[{"name":"sum_by_category","args":{"from":"2026-03-01","to":"2026-03-31","category":"groceries"}}]}';

describe("runAgent", () => {
  test("calls a tool then answers", async () => {
    const { chat, seen } = scripted([CALL, '{"answer":"You spent $12.34 on groceries."}']);
    const r = await runAgent("q", { chat, ledger });
    expect(r).toMatchObject({ answer: "You spent $12.34 on groceries.", provider: "fake" });
    if ("error" in r) throw new Error(r.error);
    expect(r.calls).toHaveLength(1);
    expect(r.steps[0]?.result).toEqual({ category: "groceries", spend_cents: 1234 });
    const feedback = seen[1]?.messages.at(-1)?.content ?? "";
    expect(feedback).toContain("$12.34");
    expect(seen[0]?.temperature).toBe(0);
  });
  test("several calls in one round, fenced JSON", async () => {
    const two = `Sure\n\`\`\`json\n{"calls":[{"name":"monthly_summary","args":{"month":"2026-03"}},{"name":"monthly_summary","args":{"month":"2026-04"}}]}\n\`\`\``;
    const { chat } = scripted([two, '{"answer":"done"}']);
    const r = await runAgent("q", { chat, ledger });
    if ("error" in r) throw new Error(r.error);
    expect(r.calls).toHaveLength(2);
  });
  test("recovers from one malformed reply", async () => {
    const { chat, seen } = scripted(["hmm", '{"answer":"ok"}']);
    const r = await runAgent("q", { chat, ledger });
    expect(r).toMatchObject({ answer: "ok" });
    expect(seen[1]?.messages.at(-1)?.content).toContain("JSON only");
  });
  test("tool errors are fed back", async () => {
    const bad = '{"calls":[{"name":"monthly_summary","args":{"month":"nope"}}]}';
    const { chat, seen } = scripted([bad, '{"answer":"fixed"}']);
    await runAgent("q", { chat, ledger });
    expect(seen[1]?.messages.at(-1)?.content).toContain("error");
  });
  test("caps at 6 rounds then forces an answer", async () => {
    const { chat, seen } = scripted([CALL, CALL, CALL, CALL, CALL, CALL, '{"answer":"forced"}']);
    const r = await runAgent("q", { chat, ledger });
    expect(r).toMatchObject({ answer: "forced" });
    if ("error" in r) throw new Error(r.error);
    expect(r.calls).toHaveLength(6);
    expect(seen).toHaveLength(7);
  });
  test("provider failure becomes an error", async () => {
    const chat = async (): Promise<ChatResponse> => {
      throw new Error("boom");
    };
    expect(await runAgent("q", { chat, ledger })).toEqual({ error: "boom" });
  });
});

describe("helpers", () => {
  test("extractJsonObject handles braces in strings", () => {
    expect(extractJsonObject('x {"a":"}{"} y')).toEqual({ a: "}{" });
    expect(extractJsonObject("none")).toBeUndefined();
  });
  test("liveAvailable", () => {
    expect(liveAvailable({})).toBe(false);
    expect(liveAvailable({ GROQ_API_KEY: "" })).toBe(false);
    expect(liveAvailable({ OPENROUTER_API_KEY: "k" })).toBe(true);
  });
});
