# 10: Compare section, story content and Open Graph images

**What to build:** the Compare section shows numbers computed by the product at render time, never hard-coded: tool exactness from the eval scorer over `fixtures/tool-cases.json`; a three-month income/spend/net table from `monthly_summary`; and the fixture's spend total next to a naive "sum every amount" figure, to show why refunds must not net. The agent number reads "pending live grading". Final copy for the hero chips, analogy and mini-glossary, Where it fits (worth it when / not needed when) and What it proves (first person), in both locales. An `opengraph-image` per locale with the product name and one-liner. See grilling Q25.

**Blocked by:** 04, 06

**Status:** resolved

- [x] Compare amounts use the locale money formatter
- [x] A test asserts the Compare data function returns the same numbers as calling the tools directly
- [x] OG images render for `en` and `es`
- [x] Copy rules hold: first person, no em dashes, no brand or company names
