import { readFileSync } from "node:fs";
import type { Json } from "./json";
import type { Ledger } from "./ledger";
import { runTool } from "./tools";

export type ToolCase = { name: string; args: unknown; expected: Json };
export type EvalResult = { cases: number; exact_rate: number; score: number; failures: string[] };

type Obj = { [key: string]: Json };
const isObj = (v: Json): v is Obj => v !== null && typeof v === "object" && !Array.isArray(v);

/** Deep equality; `{ error: "*" }` as expected matches any `{ error: string }`. */
export function matches(actual: Json, expected: Json): boolean {
  if (isObj(expected)) {
    const keys = Object.keys(expected);
    if (keys.length === 1 && keys[0] === "error" && expected.error === "*") {
      return isObj(actual) && Object.keys(actual).length === 1 && typeof actual.error === "string";
    }
    if (!isObj(actual) || Object.keys(actual).length !== keys.length) return false;
    return keys.every(
      (k) => Object.hasOwn(actual, k) && matches(actual[k] ?? null, expected[k] ?? null),
    );
  }
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((e, i) => matches(actual[i] ?? null, e))
    );
  }
  return actual === expected;
}

export function scoreCases(cases: ToolCase[], ledger: Ledger): EvalResult {
  const failures: string[] = [];
  for (const c of cases) {
    if (!matches(runTool(c.name, c.args, ledger), c.expected)) failures.push(c.name);
  }
  const exact = cases.length === 0 ? 0 : (cases.length - failures.length) / cases.length;
  return { cases: cases.length, exact_rate: exact, score: exact * 100, failures };
}

export function readCases(path: string): ToolCase[] {
  const parsed: unknown = JSON.parse(readFileSync(/* turbopackIgnore: true */ path, "utf8"));
  if (!Array.isArray(parsed)) throw new Error("cases file must be a JSON array");
  return parsed.map((c: unknown): ToolCase => {
    if (typeof c !== "object" || c === null || !("name" in c) || typeof c.name !== "string") {
      throw new Error("each case needs a name");
    }
    return {
      name: c.name,
      args: "args" in c ? c.args : {},
      expected: "expected" in c ? (c.expected as Json) : null,
    };
  });
}
