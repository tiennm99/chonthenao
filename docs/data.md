# Card and bank data

Each card is one JSON file in `src/lib/data/cards/<id>.json`, each bank one file in
`src/lib/data/banks/<id>.json`; the file name must equal the record's `id`. A bank may also have
one record each in `banking/`, `savings/` and `loans/`, named and keyed by the bank's id. The
shapes and their checks live in `src/lib/data/schema.js`, and `npm run validate-data` runs them
over every file. A bank links its credit card page (`cardsUrl`), debit card page
(`debitCardsUrl`) and fee schedule (`feeScheduleUrl`) when it has one.

## Card kinds

- `kind` is `credit` or `debit`. A card that is both (such as Cake 2in1) is stored as `credit`.
- Debit cards leave out `interestRate`, `interestFreeDays` and `minIncome` entirely; the schema
  rejects them. The site shows those rows as "không áp dụng".
- Every other card field means the same for both kinds. A debit card's `annualFee` and `fxFee`
  follow the card rules below, and its rewards are scored the same way.

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
- `minSpendMonth`, `maxCategories` and `rewardsUntil` carry the conditions the questionnaire scores:
  the monthly spend below which category rewards pay nothing, how many bonus categories work at
  once, and when the published reward terms end. Fill them from the card's own sources.
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
- A card not checked for 90 days shows a "có thể đã cũ" badge, computed in the visitor's browser
  (`src/lib/staleness.js`), so it appears on time without a rebuild. Every card and bank page has a
  "Báo thông tin sai hoặc đã cũ" link that opens a prefilled GitHub issue.

## Banking, savings and loans

- **Banking** (`banking/<bank>.json`): everyday account fees for an individual's VND payment
  account: `accountMonthlyFee`, `minBalance`, online `transferInternalFee` and
  `transferInterbankFee` (Napas 24/7), `atmOnUsFee` and `atmOffUsFee` with the bank's domestic
  debit card, `smsFeeMonth` and `digitalBankingFeeMonth`. A fee charged only below a balance is
  stored with the condition in `notes`. SMS priced in tiers stores the lowest tier. `feesFinal`
  means the same as on a card. Counter fees, packages and other accounts go in `notes`.
- **Savings** (`savings/<bank>.json`): VND term deposits for individuals, interest paid at the end
  of the term, at the lowest amount tier, for the terms in `SAVINGS_TERMS` (1, 3, 6, 9, 12, 18, 24
  and 36 months). List only the terms the bank publishes. `channel` is `online` when the bank
  publishes online rates, else `counter`; the other channel's rates, higher tiers and bonuses go in
  `notes`. `minAmount` is the smallest deposit the bank states.
- **Loans** (`loans/<bank>.json`): personal loan products of type `unsecured`, `home` or `auto`,
  named as the bank prints them. `rateFrom` is the lowest published rate ("lãi suất từ") for a
  customer outside any priority segment, `fixedMonths` how long it is fixed when stated.
  `maxTermMonths` and `maxAmount` are the published limits; a limit given only as a share of
  income or collateral stays `null` with the wording in `note`. A daily rate is stored per year
  (×365) with the published form in `note`, a monthly one ×12. A rate the bank does not publish
  stays `null`; base rates and floating-rate rules go in `notes`.
- Savings and loan rates show "có thể đã cũ" after 30 days (`RATE_STALE_AFTER_DAYS`), since banks
  change them often; banking fees, like cards, after 90.

## Referral links

A bank may carry an optional `referral` (`url`, `code`, `note`). The site shows the link only, on
the bank's page and its cards' pages, labelled "Link giới thiệu", next to the official link and the
note that the site may receive a reward. `code` stays `null` in the public data. Referrals never
appear in the catalog, comparison or suggestions, and a test checks that the ranking code never
reads bank records.

## How the site uses unknowns

The catalog (`src/lib/catalog.js`) and the ecosystem helpers (`src/lib/ecosystem.js`) never
treat `null` as 0. A card with an unknown fee never
matches a fee filter, and unknown values sort last in either direction. Points and miles show as
published; they get a "tương đương" percent only when `pointValueVnd` is set, and sort after
rewards with a known value otherwise. A card with no reward in a category counts as earning 0
there. Filters on a credit-only field (income) leave out debit cards.

The bank comparison estimates a yearly cost of everyday banking: 12 months of the account, SMS
and digital banking fees plus `YEARLY_INTERBANK_TRANSFERS` (120) interbank transfers, with 10%
VAT added when `feesFinal` is `false`. Any unknown part makes the total "chưa rõ". A bank with no
record shows "chưa có dữ liệu".
