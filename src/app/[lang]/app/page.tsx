import { notFound } from "next/navigation";
import { LiveAsk } from "@/components/LiveAsk";
import { ToolForm } from "@/components/ToolForm";
import { TracePlayer } from "@/components/TracePlayer";
import { Wordmark } from "@/components/Wordmark";
import { liveAvailable } from "@/lib/agent";
import { computeCompare } from "@/lib/compare";
import { dictionaries, isLocale, LOCALES, type Locale } from "@/lib/i18n";
import { loadLedgerFile } from "@/lib/ledger-files";
import { formatCents } from "@/lib/money";
import { loadTraces, type Trace } from "@/lib/traces";

export const dynamic = "force-dynamic";

const REPO = "https://github.com/mdeasis27/ledgerling";

function safeTraces(): Trace[] {
  try {
    return loadTraces();
  } catch {
    return [];
  }
}

export default async function AppPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale: Locale = lang;
  const d = dictionaries[locale];
  const ledger = loadLedgerFile();
  if ("error" in ledger) throw new Error(ledger.error);
  const compare = computeCompare(ledger);
  const money = (cents: number) => formatCents(cents, locale);

  return (
    <>
      <header className="topbar">
        <a className="back" href={`https://portafolio-mdea.vercel.app/${locale}/projects`}>
          {d.nav.allProjects}
        </a>
        <nav aria-label={d.nav.language} className="lang">
          {LOCALES.map((l) => (
            <a
              key={l}
              href={`/${l}/app`}
              lang={l}
              hrefLang={l}
              aria-current={l === locale ? "page" : undefined}
            >
              {l.toUpperCase()}
            </a>
          ))}
        </nav>
      </header>
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <h1 id="hero-title">
            <Wordmark />
          </h1>
          <p className="lede">{d.hero.oneLiner}</p>
          <ul className="chips">
            {d.hero.chips.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="analogy-title">
          <h2 id="analogy-title">{d.analogy.title}</h2>
          <p>{d.analogy.body}</p>
          <h3>{d.analogy.glossaryTitle}</h3>
          <dl className="glossary">
            {d.analogy.terms.map((t) => (
              <div key={t.term}>
                <dt>{t.term}</dt>
                <dd>{t.def}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="try-title" id="replay">
          <h2 id="try-title">{d.try.title}</h2>
          <p>{d.try.intro}</p>
          <div className="stack-lg">
            <TracePlayer t={d.try} traces={safeTraces()} />
            <ToolForm t={d.try} categories={ledger.categories} />
            <LiveAsk t={d.try} live={liveAvailable()} />
          </div>
        </section>

        <section aria-labelledby="compare-title">
          <h2 id="compare-title">{d.compare.title}</h2>
          <p>{d.compare.intro}</p>
          <div className="stats">
            <div className="card">
              <p className="label">{d.compare.exactnessLabel}</p>
              <p className="big">{compare.exactness.score.toFixed(0)} / 100</p>
              <p className="note">
                {compare.exactness.cases - compare.exactness.failures.length} /{" "}
                {compare.exactness.cases} {d.compare.exactnessNote}
              </p>
            </div>
            <div className="card">
              <p className="label">{d.compare.agentLabel}</p>
              <p className="big small">{d.compare.agentValue}</p>
            </div>
          </div>
          <h3>{d.compare.monthsTitle}</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">{d.compare.month}</th>
                  <th scope="col" className="num">
                    {d.compare.income}
                  </th>
                  <th scope="col" className="num">
                    {d.compare.spend}
                  </th>
                  <th scope="col" className="num">
                    {d.compare.net}
                  </th>
                </tr>
              </thead>
              <tbody>
                {compare.months.map((m) => (
                  <tr key={m.month}>
                    <th scope="row">{m.month}</th>
                    <td className="num">{money(m.income_cents)}</td>
                    <td className="num">{money(m.spend_cents)}</td>
                    <td className="num">{money(m.net_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>{d.compare.refundsTitle}</h3>
          <p>{d.compare.refundsBody}</p>
          <dl className="glossary">
            <div>
              <dt>{d.compare.honestSpend}</dt>
              <dd className="num-strong">{money(compare.spendTotal)}</dd>
            </div>
            <div>
              <dt>{d.compare.naiveSum}</dt>
              <dd className="num-strong over">{money(compare.spendIfRefundsNetted)}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="fits-title">
          <h2 id="fits-title">{d.fits.title}</h2>
          <div className="two-col">
            <div>
              <h3>{d.fits.worthTitle}</h3>
              <ul>
                {d.fits.worth.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>{d.fits.notTitle}</h3>
              <ul>
                {d.fits.notNeeded.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="proves-title">
          <h2 id="proves-title">{d.proves.title}</h2>
          <p>{d.proves.body}</p>
        </section>

        <details className="engineers">
          <summary>{d.engineers.summary}</summary>
          <h3>{d.engineers.mechanismTitle}</h3>
          <ul>
            {d.engineers.mechanism.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <h3>{d.engineers.testsTitle}</h3>
          <p>{d.engineers.tests}</p>
          <p className="stack-line">{d.engineers.stack}</p>
          <p>
            <a href={REPO}>
              {d.engineers.repoLabel}: {REPO}
            </a>
          </p>
        </details>
      </main>
    </>
  );
}
