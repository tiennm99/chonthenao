# Card and bank data

Each card is one JSON file in `src/lib/data/cards/<id>.json`, each bank one file in
`src/lib/data/banks/<id>.json`; the file name must equal the record's `id`. The shapes and their
checks live in `src/lib/data/schema.js`. A bank also links its credit card page (`cardsUrl`) and
fee schedule (`feeScheduleUrl`) when it has one, and `npm run validate-data` runs them over every file.

## Rules

- Every figure comes from the bank's own page or fee schedule. List each page in `sourceUrls`
  and set `lastVerified` to the day you checked it.
- A figure you could not confirm stays `null`; the site shows it as unknown. Never fill one in
  from memory or a third-party blog.
- Money is in VND, rates in percent (`2` means 2%), interest per year.
- Fees are stored as the source prints them. `feesFinal` is `true` when that is what the cardholder
  pays (VAT included, or the fee is not subject to VAT), `false` when VAT is added on top, and
  `null` when the source does not say. `annualFee` is the primary card's fee for a customer outside
  any priority or payroll segment; segment deals go in `feeWaiver`.
- `fxFee` is the total percent on a foreign-currency purchase at a merchant abroad: add up every
  per-transaction percentage fee the schedule charges on it, and list the parts in `notes`.
- A monthly interest rate is stored per year (×12) with the published form in `notes`; a range
  stays `null` with the range in `notes`.
- `virtual` is `true` when the bank issues a virtual card usable before or without a physical one.
- Tiered rewards store the lowest tier; higher tiers and spend conditions go in the reward `note`.
  Welcome offers are not rewards; they go in `notes`.
- Cashback rewards carry `rate`. Points and miles carry `earn` exactly as published
  (`{ "units": 1, "perVnd": 30000 }` for 1 mile per 30.000 VND) and `rate: null`; never convert
  them to a percent. `pointValueVnd` stays `null` unless the bank publishes a value.
- `category: "all"` is the base rate; a specific category overrides it. One cap shared by several
  categories goes in `sharedCaps`, a cap on one category in that reward's `capMonth`.
- `interestFreeDays` is the published maximum ("tối đa 55 ngày"). Other wordings, such as "25 ngày
  kể từ ngày sao kê", stay in `notes` with the field `null`.
- `notes` holds what the fields cannot: conditions, exclusions, and conflicts between the bank's
  own pages. When two official pages disagree, store the fee schedule's figure and note the other.
- Planned: a card not checked for 90 days will show a "có thể đã cũ" badge, computed in the
  visitor's browser (`src/lib/staleness.js`).

## Referral links

A bank may carry an optional `referral` (`url`, `code`, `note`). Planned display: labelled as a
referral link, shown beside the official link, and never allowed to change a ranking.

## How the site uses unknowns

The catalog (`src/lib/catalog.js`) never treats `null` as 0. A card with an unknown fee never
matches a fee filter, and unknown values sort last in either direction. Points and miles show as
published; they get a "tương đương" percent only when `pointValueVnd` is set, and sort after
rewards with a known value otherwise. A card with no reward in a category counts as earning 0
there.
