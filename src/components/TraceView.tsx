import type { Dict } from "@/lib/i18n";

export type ViewStep = { name: string; args: unknown; result: unknown };

type Props = {
  t: Dict["try"];
  question: string;
  steps: ViewStep[];
  answer: string;
  badge: { kind: "placeholder" } | { kind: "recorded"; by: string } | { kind: "live"; by: string };
};

/** Question, tool calls with results, then the answer. Shared by replay and live ask. */
export function TraceView({ t, question, steps, answer, badge }: Props) {
  return (
    <div className="card stack trace">
      <p className="question">{question}</p>
      <p className={badge.kind === "placeholder" ? "badge badge-warn" : "badge"}>
        {badge.kind === "placeholder" && t.placeholderBadge}
        {badge.kind === "recorded" && `${t.recordedBy} ${badge.by}`}
        {badge.kind === "live" && `${t.liveBadge}: ${badge.by}`}
      </p>
      <ol className="steps">
        {steps.map((s, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: steps are a fixed, ordered list
          <li key={i}>
            <p className="label">
              {t.stepLabel} {i + 1}: <code>{s.name}</code>
            </p>
            <pre className="code" tabIndex={0}>
              {JSON.stringify(s.args)}
            </pre>
            <p className="label">{t.resultLabel}</p>
            <pre className="code" tabIndex={0}>
              {JSON.stringify(s.result)}
            </pre>
          </li>
        ))}
      </ol>
      <p className="label">{t.answerLabel}</p>
      <p className="answer">{answer}</p>
    </div>
  );
}
