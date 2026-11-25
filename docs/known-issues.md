# Known issues

## Data

- **VIB has no cards.** Its card and fee pages return 403 to automated browsers, so nothing could
  be read from its own site. See [data-sources.md](data-sources.md).
- **SHB is not in the bank list.** Its site shows a security check even in a browser.
- **Some reward terms have ended or end soon.** VPBank StepUp and Lady terms ran to 20/11/2026 and
  no renewal was found; VietinBank, Techcombank Spark and Style and BIDV terms end 31/12/2026.
  Each card has `rewardsUntil`; the questionnaire warns about these cards and ranks expired ones
  last.
- **Rates are the lowest tier.** Cards with spend-based tiers store the lowest; higher tiers are in
  the reward notes.
- **Conditions the fields cannot hold** stay in notes and are not scored: merchant lists behind a
  category (MB and MSB "online" cover only a few marketplaces), per-transaction caps, Cake's
  pick-2 categories, Vietjet ticket cashback, payroll bonuses.
- **Interest rates published as a range** (ACB, HDBank, Sacombank, SeABank, TPBank) are stored as
  unknown.

## Scoring

- **The mile value is an assumption** (100 đ per mile, from one domestic route's award price and cash fares), since no bank publishes one. The result
  page says so and lets the reader change it.
- **Spending is estimated from brackets**, not exact amounts.
- **Fee waivers count from the second year**; first-year refund rules are not scored.
- **VAT is assumed to be 10%** where a fee schedule prints fees before VAT.

## Site

- Internal links are written without a trailing slash (`/the` rather than `/the/`). In-site
  navigation is unaffected, and both hosts redirect a typed URL to the slashed form.
