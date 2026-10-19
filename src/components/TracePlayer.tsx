"use client";

import { useId, useState } from "react";
import type { Dict } from "@/lib/i18n";
import type { Trace } from "@/lib/traces";
import { TraceView } from "./TraceView";

type Props = { t: Dict["try"]; traces: Trace[] };

export function TracePlayer({ t, traces }: Props) {
  const uid = useId();
  const [selected, setSelected] = useState(traces[0]?.id ?? "");
  const [shown, setShown] = useState<string | null>(null);

  if (traces.length === 0) return <p role="status">{t.noTraces}</p>;
  const current = traces.find((tr) => tr.id === shown);

  return (
    <div className="stack">
      <h3>{t.tracesTitle}</h3>
      <div className="row">
        <div className="field grow">
          <label htmlFor={`${uid}-q`}>{t.pickQuestion}</label>
          <select id={`${uid}-q`} value={selected} onChange={(e) => setSelected(e.target.value)}>
            {traces.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.question}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="button" onClick={() => setShown(selected)}>
          {t.replay}
        </button>
      </div>
      <div aria-live="polite">
        {current && (
          <TraceView
            t={t}
            question={current.question}
            steps={current.steps}
            answer={current.answer}
            badge={
              current.placeholder
                ? { kind: "placeholder" }
                : { kind: "recorded", by: `${current.provider ?? "?"} / ${current.model ?? "?"}` }
            }
          />
        )}
      </div>
    </div>
  );
}
