import { emit, takeFlag } from "../src/lib/cli";
import { DEFAULT_CSV, loadLedgerFile } from "../src/lib/ledger-files";
import { runTool } from "../src/lib/tools";

const argv = process.argv.slice(2);
const data = takeFlag(argv, "--data");
const [name, rawArgs] = argv;
if (!name) emit({ error: "usage: tool <name> <json-args> [--data <csv>]" }, 1);

let args: unknown = {};
if (rawArgs !== undefined) {
  try {
    args = JSON.parse(rawArgs);
  } catch {
    emit({ error: "args must be valid JSON" }, 1);
  }
}
const ledger = loadLedgerFile(data ?? DEFAULT_CSV);
if ("error" in ledger) emit({ error: ledger.error }, 1);
emit(runTool(name, args, ledger));
