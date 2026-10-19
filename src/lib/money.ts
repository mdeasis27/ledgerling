import type { Json } from "./json";

export type MoneyLocale = "en" | "es";

/** Formats integer cents using integer arithmetic only (no float division). */
export function formatCents(cents: number, locale: MoneyLocale = "en"): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  const groupSep = locale === "en" ? "," : ".";
  const decSep = locale === "en" ? "." : ",";
  const digits = String(whole);
  let grouped = "";
  for (let i = 0; i < digits.length; i += 1) {
    if (i > 0 && (digits.length - i) % 3 === 0) grouped += groupSep;
    grouped += digits[i];
  }
  const body = `${grouped}${decSep}${frac}`;
  const sign = negative ? "-" : "";
  return locale === "en" ? `${sign}$${body}` : `${sign}${body} US$`;
}

/** Collects every `*_cents` number in a tool result as path -> formatted string. */
export function formatMoneyFields(value: Json, locale: MoneyLocale = "en"): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (v: Json, path: string): void => {
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        walk(item, `${path}[${i}]`);
      });
    } else if (v !== null && typeof v === "object") {
      for (const [k, child] of Object.entries(v)) {
        const next = path === "" ? k : `${path}.${k}`;
        if (typeof child === "number" && (k.endsWith("_cents") || path.endsWith("by_category"))) {
          out[next] = formatCents(child, locale);
        } else {
          walk(child, next);
        }
      }
    }
  };
  walk(value, "");
  return out;
}
