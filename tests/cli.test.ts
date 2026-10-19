import { describe, expect, test } from "bun:test";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadLedgerFile } from "../src/lib/ledger-files";
import { runTool } from "../src/lib/tools";
import { loadTraces } from "../src/lib/traces";

function run(script: string, args: string[], env: Record<string, string> = {}) {
  const clean = { ...process.env };
  for (const k of ["GEMINI_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY"]) delete clean[k];
  const p = Bun.spawnSync(["bun", `scripts/${script}.ts`, ...args], { env: { ...clean, ...env } });
  return { code: p.exitCode, out: p.stdout.toString(), err: p.stderr.toString() };
}

describe("cli", () => {
  test("tool prints one JSON document", () => {
    const r = run("tool", ["monthly_summary", '{"month":"2026-01"}']);
    expect(r.code).toBe(0);
    expect(JSON.parse(r.out)).toMatchObject({ income_cents: 629600 });
  });
  test("tool validation errors exit 0, usage errors exit 1", () => {
    expect(run("tool", ["nope", "{}"]).code).toBe(0);
    expect(JSON.parse(run("tool", ["nope", "{}"]).out)).toHaveProperty("error");
    expect(run("tool", []).code).toBe(1);
    expect(run("tool", ["monthly_summary", "{bad"]).code).toBe(1);
    expect(run("tool", ["monthly_summary", "{}", "--data", "/no/such.csv"]).code).toBe(1);
  });
  test("tool --data", () => {
    const f = path.join(tmpdir(), "ledgerling-test.csv");
    writeFileSync(
      f,
      'date,description,amount_cents,category,account\n2026-05-01,"A, B",-700,dining,x\n',
    );
    const r = run("tool", ["monthly_summary", '{"month":"2026-05"}', "--data", f]);
    expect(JSON.parse(r.out)).toMatchObject({ spend_cents: 700 });
  });
  test("eval prints exactly three keys", () => {
    const r = run("eval", []);
    expect(Object.keys(JSON.parse(r.out))).toEqual(["cases", "exact_rate", "score"]);
    expect(JSON.parse(r.out).score).toBe(100);
  });
  test("ask and record-trace without a key exit 2", () => {
    for (const s of ["ask", "record-trace"]) {
      const r = run(s, ["hello"]);
      expect(r.code).toBe(2);
      expect(JSON.parse(r.out)).toEqual({ error: "live mode requires an LLM key" });
    }
  });
});

describe("demo traces", () => {
  test("every stored result equals the live tool output", () => {
    const ledger = loadLedgerFile();
    if ("error" in ledger) throw new Error(ledger.error);
    const traces = loadTraces();
    expect(traces.length).toBeGreaterThan(0);
    for (const t of traces)
      for (const s of t.steps) expect(runTool(s.name, s.args, ledger)).toEqual(s.result);
  });
  test("only real recorded runs ship", () => {
    for (const t of loadTraces()) expect(t.placeholder).toBe(false);
  });
});
