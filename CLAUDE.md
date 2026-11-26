# CLAUDE.md

Static SvelteKit site (Svelte 5, Tailwind 4, plain JS with JSDoc, npm) that helps people in Vietnam
compare credit and debit cards and banks: everyday banking fees, savings rates and loan rates.
Start with [README.md](README.md) and the files under [docs/](docs/).

## Rules

- **Every figure comes from the bank's own page or fee schedule**, never from memory, blogs or
  comparison sites. Unknown stays `null`. List each source in `sourceUrls` and set `lastVerified`.
  Rules for each field: [docs/data.md](docs/data.md).
- **Never publish a referral code**, only the link. The schema rejects a non-null `code`.
- **Referrals never affect ranking.** `src/lib/catalog.js`, `scoring.js`, `quiz.js` and
  `ecosystem.js` must not read bank records; a test enforces it.
- **The disclaimer stays on every page** (`npm run check-disclaimer`), and suggestions carry
  `SUGGESTION_DISCLAIMER`.
- **The questionnaire stays at 20 questions or fewer, with 2 to 4 answers each**; tests enforce
  both.
- No bank logos: text names only.
- User-facing text is Vietnamese; code, comments and docs are English.

## Checks

```sh
npm run lint && npm run format:check && npm run check && npm test && npm run validate-data
npm run build && npm run check-disclaimer && npm run e2e
```
