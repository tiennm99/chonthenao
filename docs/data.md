# Card and bank data

Each card is one JSON file in `src/lib/data/cards/<id>.json`, each bank one file in
`src/lib/data/banks/<id>.json`; the file name must equal the record's `id`. The shapes and their
checks live in `src/lib/data/schema.js`, and `npm run validate-data` runs them over every file.

## Rules

- Every figure comes from the bank's own page or fee schedule. List each page in `sourceUrls`
  and set `lastVerified` to the day you checked it.
- A figure you could not confirm stays `null`; the site shows it as unknown. Never fill one in
  from memory or a third-party blog.
- Money is in VND, rates in percent (`2` means 2%).
- Planned: a card not checked for 90 days will show a "có thể đã cũ" badge, computed in the
  visitor's browser (`src/lib/staleness.js`).

## Referral links

A bank may carry an optional `referral` (`url`, `code`, `note`). Planned display: labelled as a
referral link, shown beside the official link, and never allowed to change a ranking.
