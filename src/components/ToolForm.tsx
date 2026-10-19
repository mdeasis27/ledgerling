"use client";

import { useId, useState } from "react";
import type { ArgName, Dict } from "@/lib/i18n";
import { TOOL_CATALOGUE, type ToolName } from "@/lib/tools";

type Props = { t: Dict["try"]; categories: string[] };

const TOOL_NAMES = Object.keys(TOOL_CATALOGUE) as ToolName[];

function toValue(raw: string): string | number {
  return /^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw;
}

export function ToolForm({ t, categories }: Props) {
  const uid = useId();
  const [tool, setTool] = useState<ToolName>("sum_by_category");
  const [values, setValues] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);

  const specs = TOOL_CATALOGUE[tool].args;

  async function run(event: React.FormEvent) {
    event.preventDefault();
    const args: Record<string, string | number> = {};
    for (const spec of specs) {
      const raw = (values[spec.name] ?? "").trim();
      if (raw === "") continue;
      args[spec.name] = spec.kind === "cents" || spec.kind === "count" ? toValue(raw) : raw;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/tool", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: tool, args }),
      });
      setOutput(JSON.stringify(await res.json(), null, 2));
    } catch {
      setOutput(JSON.stringify({ error: "request failed" }, null, 2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={run} className="card stack" aria-labelledby={`${uid}-title`}>
      <h3 id={`${uid}-title`}>{t.formTitle}</h3>
      <div className="field">
        <label htmlFor={`${uid}-tool`}>{t.toolLabel}</label>
        <select
          id={`${uid}-tool`}
          value={tool}
          onChange={(e) => {
            setTool(e.target.value as ToolName);
            setValues({});
            setOutput("");
          }}
        >
          {TOOL_NAMES.map((name) => (
            <option key={name} value={name}>
              {t.tools[name]} ({name})
            </option>
          ))}
        </select>
      </div>
      {specs.map((spec) => {
        const id = `${uid}-${tool}-${spec.name}`;
        const label = `${t.fields[spec.name as ArgName]}${spec.required ? "" : ` (${t.optional})`}`;
        return (
          <div className="field" key={id}>
            <label htmlFor={id}>{label}</label>
            {spec.kind === "category" ? (
              <select
                id={id}
                value={values[spec.name] ?? ""}
                onChange={(e) => setValues({ ...values, [spec.name]: e.target.value })}
              >
                <option value="">{spec.required ? "" : "-"}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={id}
                type="text"
                inputMode={spec.kind === "cents" || spec.kind === "count" ? "numeric" : "text"}
                autoComplete="off"
                value={values[spec.name] ?? ""}
                onChange={(e) => setValues({ ...values, [spec.name]: e.target.value })}
              />
            )}
          </div>
        );
      })}
      <button type="submit" className="button" disabled={busy}>
        {busy ? t.running : t.run}
      </button>
      <div aria-live="polite">
        {output !== "" && (
          <>
            <p className="label">{t.outputLabel}</p>
            <pre className="code" tabIndex={0}>
              {output}
            </pre>
          </>
        )}
      </div>
    </form>
  );
}
