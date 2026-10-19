import { parseCsv } from "./csv";
import { isValidDate } from "./dates";

export type Transaction = {
  date: string;
  description: string;
  amount_cents: number;
  category: string;
  account: string;
};

export type Ledger = {
  transactions: Transaction[];
  categories: string[];
  coverage: { from: string; to: string } | null;
};

const COLUMNS = ["date", "description", "amount_cents", "category", "account"] as const;

/** Builds a ledger from CSV text. Returns an error message string on malformed input. */
export function loadLedger(
  csv: string,
  knownCategories: readonly string[],
): Ledger | { error: string } {
  let rows: string[][];
  try {
    rows = parseCsv(csv);
  } catch (e) {
    return { error: `invalid CSV: ${e instanceof Error ? e.message : "parse failure"}` };
  }
  const header = rows[0]?.map((h) => h.trim());
  if (!header) return { error: "invalid CSV: empty file" };
  const index: Record<string, number> = {};
  for (const col of COLUMNS) {
    const at = header.indexOf(col);
    if (at < 0) return { error: `invalid CSV: missing column "${col}"` };
    index[col] = at;
  }
  const transactions: Transaction[] = [];
  const categories = new Set(knownCategories);
  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r] ?? [];
    const get = (col: (typeof COLUMNS)[number]): string => row[index[col] ?? -1] ?? "";
    const date = get("date").trim();
    const amountText = get("amount_cents").trim();
    if (!isValidDate(date)) return { error: `invalid CSV: bad date "${date}" on line ${r + 1}` };
    if (!/^[+-]?\d+$/.test(amountText)) {
      return { error: `invalid CSV: bad amount_cents "${amountText}" on line ${r + 1}` };
    }
    const amount = Number(amountText);
    if (!Number.isSafeInteger(amount))
      return { error: `invalid CSV: amount too large on line ${r + 1}` };
    const category = get("category").trim();
    categories.add(category);
    transactions.push({
      date,
      description: get("description"),
      amount_cents: amount,
      category,
      account: get("account").trim(),
    });
  }
  let coverage: Ledger["coverage"] = null;
  for (const t of transactions) {
    if (!coverage) coverage = { from: t.date, to: t.date };
    else {
      if (t.date < coverage.from) coverage.from = t.date;
      if (t.date > coverage.to) coverage.to = t.date;
    }
  }
  return { transactions, categories: [...categories], coverage };
}
