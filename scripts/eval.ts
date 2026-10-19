import path from "node:path";
import { emit, takeFlag, takeSwitch } from "../src/lib/cli";
import { readCases, scoreCases } from "../src/lib/eval";
import { DEFAULT_CSV, FIXTURES_DIR, loadLedgerFile } from "../src/lib/ledger-files";

const argv = process.argv.slice(2);
const verbose = takeSwitch(argv, "--verbose");
const casesPath = takeFlag(argv, "--cases") ?? path.join(FIXTURES_DIR, "tool-cases.json");
const data = takeFlag(argv, "--data") ?? DEFAULT_CSV;

const ledger = loadLedgerFile(data);
if ("error" in ledger) emit({ error: ledger.error }, 1);
let result: ReturnType<typeof scoreCases>;
try {
  result = scoreCases(readCases(casesPath), ledger);
} catch (e) {
  emit({ error: e instanceof Error ? e.message : "cannot read cases" }, 1);
}
if (verbose) for (const name of result.failures) process.stderr.write(`FAIL ${name}\n`);
emit({ cases: result.cases, exact_rate: result.exact_rate, score: result.score });
