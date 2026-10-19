import { readFileSync } from "node:fs";
import path from "node:path";
import { type Ledger, loadLedger } from "./ledger";

export const FIXTURES_DIR = path.join(process.cwd(), "fixtures");
export const DEFAULT_CSV = path.join(FIXTURES_DIR, "transactions.csv");

export function readCategories(): string[] {
  const parsed: unknown = JSON.parse(
    readFileSync(/* turbopackIgnore: true */ path.join(FIXTURES_DIR, "categories.json"), "utf8"),
  );
  if (!Array.isArray(parsed) || !parsed.every((c): c is string => typeof c === "string")) {
    throw new Error("categories.json must be an array of strings");
  }
  return parsed;
}

/** Loads a CSV file into a ledger; the error variant carries a message. */
export function loadLedgerFile(csvPath: string = DEFAULT_CSV): Ledger | { error: string } {
  let text: string;
  try {
    text = readFileSync(/* turbopackIgnore: true */ csvPath, "utf8");
  } catch {
    return { error: `cannot read data file: ${csvPath}` };
  }
  return loadLedger(text, readCategories());
}
