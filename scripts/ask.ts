import { chat } from "../ai-kit/router";
import { liveAvailable, runAgent } from "../src/lib/agent";
import { emit, takeFlag } from "../src/lib/cli";
import { DEFAULT_CSV, loadLedgerFile } from "../src/lib/ledger-files";

const argv = process.argv.slice(2);
const data = takeFlag(argv, "--data") ?? DEFAULT_CSV;
const question = argv.join(" ").trim();

if (!liveAvailable()) emit({ error: "live mode requires an LLM key" }, 2);
if (question === "") emit({ error: 'usage: ask "<question>"' }, 1);
const ledger = loadLedgerFile(data);
if ("error" in ledger) emit({ error: ledger.error }, 1);
const result = await runAgent(question, { chat, ledger });
if ("error" in result) emit({ error: result.error }, 1);
emit({ answer: result.answer, calls: result.calls });
