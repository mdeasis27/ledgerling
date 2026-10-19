import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { JsonObject } from "./json";

export type TraceStep = { name: string; args: unknown; result: JsonObject };
export type Trace = {
  id: string;
  question: string;
  placeholder: boolean;
  recorded_at?: string;
  provider?: string;
  model?: string;
  steps: TraceStep[];
  answer: string;
};

export const TRACES_PATH = path.join(process.cwd(), "fixtures", "demo-traces.json");

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toStep(v: unknown): TraceStep | null {
  if (!isRecord(v) || typeof v.name !== "string" || !isRecord(v.result)) return null;
  return { name: v.name, args: v.args ?? {}, result: v.result as JsonObject };
}

function toTrace(v: unknown): Trace | null {
  if (!isRecord(v)) return null;
  if (typeof v.id !== "string" || typeof v.question !== "string" || typeof v.answer !== "string")
    return null;
  if (typeof v.placeholder !== "boolean" || !Array.isArray(v.steps)) return null;
  const steps: TraceStep[] = [];
  for (const s of v.steps) {
    const step = toStep(s);
    if (!step) return null;
    steps.push(step);
  }
  return {
    id: v.id,
    question: v.question,
    placeholder: v.placeholder,
    recorded_at: typeof v.recorded_at === "string" ? v.recorded_at : undefined,
    provider: typeof v.provider === "string" ? v.provider : undefined,
    model: typeof v.model === "string" ? v.model : undefined,
    steps,
    answer: v.answer,
  };
}

/** Validates parsed JSON as a trace file. Throws on any malformed trace. */
export function parseTraces(raw: unknown): Trace[] {
  if (!isRecord(raw) || !Array.isArray(raw.traces))
    throw new Error("traces file must be { traces: [...] }");
  return raw.traces.map((t, i) => {
    const trace = toTrace(t);
    if (!trace) throw new Error(`invalid trace at index ${i}`);
    return trace;
  });
}

export function loadTraces(file: string = TRACES_PATH): Trace[] {
  return parseTraces(JSON.parse(readFileSync(/* turbopackIgnore: true */ file, "utf8")));
}

/** Appends a real trace; drops placeholder traces once a real one exists. */
export function appendTrace(trace: Trace, file: string = TRACES_PATH): Trace[] {
  const existing = loadTraces(file);
  const next = [...existing, trace].filter((t) => !t.placeholder || trace.placeholder);
  writeFileSync(file, `${JSON.stringify({ traces: next }, null, 2)}\n`);
  return next;
}
