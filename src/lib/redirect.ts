import { DEFAULT_LOCALE, isLocale } from "./i18n";

export type RedirectDecision = { kind: "pass" } | { kind: "redirect"; to: string };

/**
 * Decides what the proxy does with a request.
 * - no locale prefix: redirect to /en + path, keeping the query string
 * - /{lang}: redirect to /{lang}/app
 * - unknown 2-letter locale or known locale deeper path: pass (Next answers 404 or renders)
 */
export function resolveLocaleRedirect(pathname: string, search = ""): RedirectDecision {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  const query = search === "" || search.startsWith("?") ? search : `?${search}`;
  if (first === undefined) return { kind: "redirect", to: `/${DEFAULT_LOCALE}/app${query}` };
  if (isLocale(first)) {
    if (segments.length === 1) return { kind: "redirect", to: `/${first}/app${query}` };
    return { kind: "pass" };
  }
  if (/^[a-z]{2}$/i.test(first)) return { kind: "pass" };
  return { kind: "redirect", to: `/${DEFAULT_LOCALE}/${segments.join("/")}${query}` };
}
