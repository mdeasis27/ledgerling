"use client";

import { useId, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { TraceView, type ViewStep } from "./TraceView";

type Props = { t: Dict["try"]; live: boolean };

type Answer = { question: string; steps: ViewStep[]; answer: string; by: string };

export function LiveAsk({ t, live }: Props) {
  const uid = useId();
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Answer | null>(null);
  const [problem, setProblem] = useState("");

  if (!live) {
    return (
      <div className="stack">
        <h3>{t.liveTitle}</h3>
        <p className="note">{t.liveOff}</p>
      </div>
    );
  }

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setProblem("");
    setResult(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const body: {
        answer?: string;
        steps?: ViewStep[];
        provider?: string;
        model?: string;
      } = await res.json();
      if (res.status === 429) setProblem(t.rateLimited);
      else if (!res.ok || typeof body.answer !== "string") setProblem(t.liveFailed);
      else {
        setResult({
          question,
          steps: body.steps ?? [],
          answer: body.answer,
          by: `${body.provider ?? "?"} / ${body.model ?? "?"}`,
        });
      }
    } catch {
      setProblem(t.liveFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <h3>{t.liveTitle}</h3>
      <form onSubmit={ask} className="stack">
        <div className="field">
          <label htmlFor={`${uid}-q`}>{t.askLabel}</label>
          <input
            id={`${uid}-q`}
            type="text"
            maxLength={500}
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>
        <button type="submit" className="button" disabled={busy}>
          {busy ? t.asking : t.askButton}
        </button>
      </form>
      <div aria-live="polite">
        {problem !== "" && (
          <p className="alert" role="alert">
            {problem} <a href="#replay">{t.backToDemo}</a>
          </p>
        )}
        {result && (
          <TraceView
            t={t}
            question={result.question}
            steps={result.steps}
            answer={result.answer}
            badge={{ kind: "live", by: result.by }}
          />
        )}
      </div>
    </div>
  );
}
