import { isValidDate, isValidMonth } from "./dates";
import type { Json, JsonObject } from "./json";
import type { Ledger, Transaction } from "./ledger";

export type ToolName =
  | "sum_by_category"
  | "list_transactions"
  | "top_merchants"
  | "monthly_summary"
  | "budget_status";

export type ArgSpec = {
  name: string;
  kind: "date" | "month" | "category" | "text" | "cents" | "count";
  required: boolean;
  description: string;
};

const FROM: ArgSpec = {
  name: "from",
  kind: "date",
  required: true,
  description: "start date YYYY-MM-DD, inclusive",
};
const TO: ArgSpec = {
  name: "to",
  kind: "date",
  required: true,
  description: "end date YYYY-MM-DD, inclusive",
};

export const TOOL_CATALOGUE: Record<ToolName, { description: string; args: ArgSpec[] }> = {
  sum_by_category: {
    description: "Spend per category in a date range, or the spend of one category.",
    args: [
      FROM,
      TO,
      { name: "category", kind: "category", required: false, description: "limit to one category" },
    ],
  },
  list_transactions: {
    description: "Transactions in a date range, newest first.",
    args: [
      FROM,
      TO,
      { name: "category", kind: "category", required: false, description: "only this category" },
      {
        name: "merchant",
        kind: "text",
        required: false,
        description: "case-insensitive text inside the description",
      },
      {
        name: "min_cents",
        kind: "cents",
        required: false,
        description: "minimum absolute amount in cents",
      },
      {
        name: "max_cents",
        kind: "cents",
        required: false,
        description: "maximum absolute amount in cents",
      },
      {
        name: "limit",
        kind: "count",
        required: false,
        description: "keep only the first N after sorting",
      },
    ],
  },
  top_merchants: {
    description: "Merchants ranked by money out in a date range.",
    args: [
      FROM,
      TO,
      { name: "n", kind: "count", required: true, description: "how many merchants, at least 1" },
    ],
  },
  monthly_summary: {
    description: "Income, spend and net for one month.",
    args: [{ name: "month", kind: "month", required: true, description: "month YYYY-MM" }],
  },
  budget_status: {
    description: "Spend of a category in a month against a budget.",
    args: [
      { name: "category", kind: "category", required: true, description: "category name" },
      { name: "month", kind: "month", required: true, description: "month YYYY-MM" },
      { name: "budget_cents", kind: "cents", required: true, description: "budget in cents" },
    ],
  },
};

export function isToolName(name: string): name is ToolName {
  return Object.hasOwn(TOOL_CATALOGUE, name);
}

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

type Args = Record<string, unknown>;

function present(args: Args, key: string): boolean {
  return args[key] !== undefined && args[key] !== null;
}

function str(args: Args, key: string, required: boolean): Parsed<string | undefined> {
  if (!present(args, key)) {
    return required ? fail(`missing required argument "${key}"`) : { ok: true, value: undefined };
  }
  const v = args[key];
  if (typeof v !== "string") return fail(`"${key}" must be a string`);
  return { ok: true, value: v };
}

function date(args: Args, key: string): Parsed<string> {
  const s = str(args, key, true);
  if (!s.ok) return s;
  if (s.value === undefined || !isValidDate(s.value)) {
    return fail(`invalid date for "${key}": ${String(args[key])} (use YYYY-MM-DD)`);
  }
  return { ok: true, value: s.value };
}

function month(args: Args): Parsed<string> {
  const s = str(args, "month", true);
  if (!s.ok) return s;
  if (s.value === undefined || !isValidMonth(s.value)) {
    return fail(`invalid month: ${String(args.month)} (use YYYY-MM)`);
  }
  return { ok: true, value: s.value };
}

function integer(
  args: Args,
  key: string,
  min: number,
  required: boolean,
): Parsed<number | undefined> {
  if (!present(args, key)) {
    return required ? fail(`missing required argument "${key}"`) : { ok: true, value: undefined };
  }
  const v = args[key];
  if (typeof v !== "number" || !Number.isSafeInteger(v)) return fail(`"${key}" must be an integer`);
  if (v < min) return fail(`"${key}" must be at least ${min}`);
  return { ok: true, value: v };
}

function category(args: Args, ledger: Ledger, required: boolean): Parsed<string | undefined> {
  const s = str(args, "category", required);
  if (!s.ok) return s;
  if (s.value !== undefined && !ledger.categories.includes(s.value)) {
    return fail(`unknown category: ${s.value}`);
  }
  return s;
}

function range(args: Args): Parsed<{ from: string; to: string }> {
  const from = date(args, "from");
  if (!from.ok) return from;
  const to = date(args, "to");
  if (!to.ok) return to;
  if (from.value > to.value) return fail(`"from" (${from.value}) is after "to" (${to.value})`);
  return { ok: true, value: { from: from.value, to: to.value } };
}

const inRange = (t: Transaction, from: string, to: string): boolean =>
  t.date >= from && t.date <= to;
const inMonth = (t: Transaction, m: string): boolean => t.date.slice(0, 7) === m;
const spendOf = (t: Transaction): number => (t.amount_cents < 0 ? -t.amount_cents : 0);

function sumByCategory(args: Args, ledger: Ledger): JsonObject {
  const r = range(args);
  if (!r.ok) return { error: r.error };
  const c = category(args, ledger, false);
  if (!c.ok) return { error: c.error };
  const by: Record<string, number> = {};
  for (const t of ledger.transactions) {
    const s = spendOf(t);
    if (s === 0 || !inRange(t, r.value.from, r.value.to)) continue;
    by[t.category] = (by[t.category] ?? 0) + s;
  }
  if (c.value !== undefined) return { category: c.value, spend_cents: by[c.value] ?? 0 };
  return { by_category: by };
}

function listTransactions(args: Args, ledger: Ledger): JsonObject {
  const r = range(args);
  if (!r.ok) return { error: r.error };
  const c = category(args, ledger, false);
  if (!c.ok) return { error: c.error };
  const m = str(args, "merchant", false);
  if (!m.ok) return { error: m.error };
  const min = integer(args, "min_cents", 0, false);
  if (!min.ok) return { error: min.error };
  const max = integer(args, "max_cents", 0, false);
  if (!max.ok) return { error: max.error };
  const limit = integer(args, "limit", 0, false);
  if (!limit.ok) return { error: limit.error };
  const needle = m.value?.toLowerCase();
  const found = ledger.transactions
    .map((t, index) => ({ t, index }))
    .filter(({ t }) => {
      if (!inRange(t, r.value.from, r.value.to)) return false;
      if (c.value !== undefined && t.category !== c.value) return false;
      if (needle !== undefined && !t.description.toLowerCase().includes(needle)) return false;
      const abs = Math.abs(t.amount_cents);
      if (min.value !== undefined && abs < min.value) return false;
      if (max.value !== undefined && abs > max.value) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.t.date === b.t.date) return a.index - b.index;
      return a.t.date < b.t.date ? 1 : -1;
    })
    .map(
      ({ t }): Json => ({
        date: t.date,
        description: t.description,
        amount_cents: t.amount_cents,
        category: t.category,
        account: t.account,
      }),
    );
  return { transactions: limit.value === undefined ? found : found.slice(0, limit.value) };
}

function topMerchants(args: Args, ledger: Ledger): JsonObject {
  const r = range(args);
  if (!r.ok) return { error: r.error };
  const n = integer(args, "n", 1, true);
  if (!n.ok) return { error: n.error };
  const by = new Map<string, number>();
  for (const t of ledger.transactions) {
    const s = spendOf(t);
    if (s === 0 || !inRange(t, r.value.from, r.value.to)) continue;
    by.set(t.description, (by.get(t.description) ?? 0) + s);
  }
  const merchants = [...by.entries()]
    .sort(([da, sa], [db, sb]) => {
      if (sa !== sb) return sb - sa;
      return da < db ? -1 : da > db ? 1 : 0;
    })
    .slice(0, n.value)
    .map(([description, spend_cents]): Json => ({ description, spend_cents }));
  return { merchants };
}

function monthlySummary(args: Args, ledger: Ledger): JsonObject {
  const m = month(args);
  if (!m.ok) return { error: m.error };
  let income = 0;
  let spend = 0;
  for (const t of ledger.transactions) {
    if (!inMonth(t, m.value)) continue;
    if (t.amount_cents > 0) income += t.amount_cents;
    else spend += -t.amount_cents;
  }
  return { month: m.value, income_cents: income, spend_cents: spend, net_cents: income - spend };
}

function budgetStatus(args: Args, ledger: Ledger): JsonObject {
  const c = category(args, ledger, true);
  if (!c.ok) return { error: c.error };
  const m = month(args);
  if (!m.ok) return { error: m.error };
  const b = integer(args, "budget_cents", 0, true);
  if (!b.ok) return { error: b.error };
  const budget = b.value ?? 0;
  let spend = 0;
  for (const t of ledger.transactions) {
    if (t.category === c.value && inMonth(t, m.value)) spend += spendOf(t);
  }
  return {
    category: c.value ?? "",
    month: m.value,
    spend_cents: spend,
    remaining_cents: budget - spend,
    over: spend > budget,
  };
}

/** Runs one tool. Never throws: bad input comes back as `{ error }`. */
export function runTool(name: string, args: unknown, ledger: Ledger): JsonObject {
  if (!isToolName(name)) return { error: `unknown tool: ${name}` };
  if (typeof args !== "object" || args === null || Array.isArray(args)) {
    return { error: "args must be a JSON object" };
  }
  const a = args as Args;
  switch (name) {
    case "sum_by_category":
      return sumByCategory(a, ledger);
    case "list_transactions":
      return listTransactions(a, ledger);
    case "top_merchants":
      return topMerchants(a, ledger);
    case "monthly_summary":
      return monthlySummary(a, ledger);
    case "budget_status":
      return budgetStatus(a, ledger);
  }
}
