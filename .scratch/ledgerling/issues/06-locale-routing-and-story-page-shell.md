# 06: Locale routing, typed dictionary and the story page shell

**What to build:** `bun run dev` serves `/en/app` and `/es/app` as a story page with every section in order (hero with name, one-liner and chips; analogy with a 3-5 term mini-glossary; Try it; Compare; Where it fits; What it proves; a collapsed `<details>` "For engineers" / "Para ingenieros"), with copy in both languages from one typed `Record<"en" | "es", Dict>`, the top-left "← All projects" / "← Todos los proyectos" link to `https://portafolio-mdea.vercel.app/{lang}/projects`, and an EN/ES switch. `/` and locale-less paths redirect to `/en…` keeping the query string; `/{lang}` redirects to `/{lang}/app`; unknown locales return 404. Base identity tokens (paper cream, ink navy, deep teal, brick red; Fraunces + IBM Plex Sans/Mono via `next/font`) and the text wordmark are in place. Try it and Compare may hold stubs until tickets 07 to 10. See grilling Q24 to Q28.

**Blocked by:** 01

**Status:** resolved

- [x] `resolveLocaleRedirect` is a pure function with table tests; the proxy/middleware matcher excludes `/api`, `_next`, static files and `opengraph-image`
- [x] The `[lang]` segment uses static params `en`, `es` with `dynamicParams = false`
- [x] Removing a key from the `es` dictionary fails `typecheck`
- [x] "For engineers" contains the mechanism, how it is tested, a `Stack: …` line and a link to `https://github.com/mdeasis27/ledgerling`
- [x] One `h1`, `<html lang>` matches the locale, visible focus styles, works at 375 px
- [x] Copy is first person, plain words, no em dashes, no brand or company names
