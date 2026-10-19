import path from "node:path";
import { type EvalResult, readCases, scoreCases } from "./eval";
import type { Ledger } from "./ledger";
import { FIXTURES_DIR } from "./ledger-files";
import { runTool } from "./tools";

export type MonthRow = {
  month: string;
  income_cents: number;
  spend_cents: number;
  net_cents: number;
};
export type CompareData = {
  exactness: EvalResult;
  months: MonthRow[];
  spendTotal: number;
  spendIfRefundsNetted: number;
};

function monthsBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let y = Number(from.slice(0, 4));
  let m = Number(from.slice(5, 7));
  const last = to.slice(0, 7);
  for (;;) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    out.push(key);
    if (key >= last) return out;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
}

function num(v: unknown): number {
  return typeof v === "number" ? v : 0;
}

/** Everything the Compare section shows, computed through the tools. */
export function computeCompare(ledger: Ledger): CompareData {
  const exactness = scoreCases(readCases(path.join(FIXTURES_DIR, "tool-cases.json")), ledger);
  const cov = ledger.coverage;
  const months: MonthRow[] = [];
  if (cov) {
    for (const month of monthsBetween(cov.from, cov.to)) {
      const r = runTool("monthly_summary", { month }, ledger);
      months.push({
        month,
        income_cents: num(r.income_cents),
        spend_cents: num(r.spend_cents),
        net_cents: num(r.net_cents),
      });
    }
  }
  const spendTotal = months.reduce((s, m) => s + m.spend_cents, 0);
  const refunds = ledger.transactions
    .filter((t) => t.amount_cents > 0 && t.category !== "income")
    .reduce((s, t) => s + t.amount_cents, 0);
  return { exactness, months, spendTotal, spendIfRefundsNetted: spendTotal - refunds };
}
