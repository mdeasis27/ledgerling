import { chat } from "../ai-kit/router";
import { liveAvailable, runAgent } from "../src/lib/agent";
import { emit } from "../src/lib/cli";
import { DEFAULT_CSV, loadLedgerFile } from "../src/lib/ledger-files";
import { appendTrace } from "../src/lib/traces";

const question = process.argv.slice(2).join(" ").trim();

if (!liveAvailable()) emit({ error: "live mode requires an LLM key" }, 2);
if (question === "") emit({ error: 'usage: record-trace "<question>"' }, 1);
const ledger = loadLedgerFile(DEFAULT_CSV);
if ("error" in ledger) emit({ error: ledger.error }, 1);
const result = await runAgent(question, { chat, ledger });
if ("error" in result) emit({ error: result.error }, 1);
const trace = {
  id: `rec-${Date.now()}`,
  question,
  placeholder: false,
  recorded_at: new Date().toISOString(),
  provider: result.provider,
  model: result.model,
  steps: result.steps,
  answer: result.answer,
};
appendTrace(trace);
emit(trace);
