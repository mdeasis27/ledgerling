import { describe, expect, test } from "bun:test";
import type { ChatResponse } from "../ai-kit/types";
import { handleAsk, handleTool } from "../src/lib/api";
import { computeCompare } from "../src/lib/compare";
import { dictionaries } from "../src/lib/i18n";
import { loadLedgerFile } from "../src/lib/ledger-files";
import { resolveLocaleRedirect } from "../src/lib/redirect";
import { runTool } from "../src/lib/tools";

const post = (body: unknown) =>
  new Request("http://x/api", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("resolveLocaleRedirect", () => {
  const cases: [string, string, string | null][] = [
    ["/", "", "/en/app"],
    ["/", "?x=1", "/en/app?x=1"],
    ["/app", "?q=2", "/en/app?q=2"],
    ["/en", "", "/en/app"],
    ["/es", "?a=b", "/es/app?a=b"],
    ["/en/app", "", null],
    ["/es/app", "?z=1", null],
    ["/fr", "", null],
    ["/fr/app", "", null],
    ["/something/deep", "?k=v", "/en/something/deep?k=v"],
  ];
  for (const [path, search, to] of cases) {
    test(`${path}${search}`, () => {
      expect(resolveLocaleRedirect(path, search)).toEqual(
        to === null ? { kind: "pass" } : { kind: "redirect", to },
      );
    });
  }
});

describe("api handlers", () => {
  test("tool: valid, validation error, unknown tool, bad body", async () => {
    const ok = await handleTool(post({ name: "monthly_summary", args: { month: "2026-01" } }));
    expect(await ok.json()).toMatchObject({ income_cents: 629600 });
    const bad = await handleTool(post({ name: "monthly_summary", args: { month: "x" } }));
    expect(bad.status).toBe(200);
    expect(await bad.json()).toHaveProperty("error");
    expect(await (await handleTool(post({ name: "zzz" }))).json()).toHaveProperty("error");
    expect((await handleTool(post("not json"))).status).toBe(400);
  });

  test("ask: no key is a 503 live-mode error", async () => {
    const chat = async (): Promise<ChatResponse> => {
      throw new Error("must not be called");
    };
    const res = await handleAsk(post({ question: "hi" }), { chat, env: {} });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "live mode requires an LLM key" });
  });

  test("ask: success with a fake model, then rate limit", async () => {
    const chat = async (): Promise<ChatResponse> => ({
      text: '{"answer":"fine"}',
      provider: "fake",
      model: "m",
      latency_ms: 1,
    });
    const env = { GROQ_API_KEY: "k" };
    const limit = { maxRequests: 1, windowMs: 60_000 };
    const req = () =>
      new Request("http://x/api/ask", {
        method: "POST",
        headers: { "x-forwarded-for": "9.9.9.9" },
        body: JSON.stringify({ question: "q" }),
      });
    const first = await handleAsk(req(), { chat, env, limit });
    expect(await first.json()).toMatchObject({ answer: "fine", provider: "fake" });
    const second = await handleAsk(req(), { chat, env, limit });
    expect(second.status).toBe(429);
    expect(await second.json()).toHaveProperty("retryAfterSeconds");
  });

  test("ask: empty question is a 400", async () => {
    const chat = async (): Promise<ChatResponse> => ({
      text: "",
      provider: "f",
      model: "m",
      latency_ms: 1,
    });
    const res = await handleAsk(post({ question: "  " }), { chat, env: { GROQ_API_KEY: "k" } });
    expect(res.status).toBe(400);
  });
});

describe("compare data", () => {
  test("matches calling the tools directly", () => {
    const ledger = loadLedgerFile();
    if ("error" in ledger) throw new Error(ledger.error);
    const data = computeCompare(ledger);
    expect(data.exactness.score).toBe(100);
    expect(data.months.map((m) => m.month)).toEqual(["2026-01", "2026-02", "2026-03"]);
    for (const m of data.months)
      expect(runTool("monthly_summary", { month: m.month }, ledger)).toMatchObject(m);
    expect(data.spendIfRefundsNetted).toBe(data.spendTotal - 2999 - 1850);
  });
});

describe("copy rules", () => {
  test("no em dashes and both locales carry the same shape", () => {
    expect(JSON.stringify(dictionaries)).not.toContain("—");
    expect(Object.keys(dictionaries.en)).toEqual(Object.keys(dictionaries.es));
  });
});
