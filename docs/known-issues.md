# Known issues

## Data

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
- **VIB is only partly covered.** Its site blocks automated reading, so its savings rates are
  unknown, it has no loans record, and its debit card and banking figures have not had a second
  check. They need a re-read in a real browser.
- **Debit cards not covered yet:** Sacombank Mastercard Gold, UnionPay and Metro Pass; Standard
  Chartered's Platinum debit card. Cake issues no debit card
  of its own, and Standard Chartered no Napas card.
- **Inferred card networks.** TPBank ATM Smart 24/7 and VPBank AutoLink are stored as Napas, though
  the banks name no network; the schema has no unknown network. Their notes say so. VPBank The 1
  card's fees are unknown, since its page links another card's fee schedule.
- **Banking fees assume one account per bank, and the choice differs.** Vietcombank's and
  VietinBank's monthly fee of 0 assume an account used with the bank's app; Sacombank's 6.000 is
  the plain account (one opened in the app pays 0). The notes give the alternatives.
- **Some fees hold only for a date range:** ACB's account schedule takes effect 01/12/2026 and its
  ACB ONE app is free only until 31/12/2026.

## Savings and loans

- **Rates change often**, sometimes weekly, so they go stale after 30 days rather than 90.
- **Savings rates are the lowest amount tier**, interest at the end of the term; higher tiers,
  priority bonuses and the other channel are in notes. Some banks publish no online rate for some
  terms (ACB online has no 18, 24 or 36 months; Vietcombank online no 18 or 36).
- **"Lãi suất từ" is a floor, often promotional.** It holds for a fixed first period and eligible
  borrowers; the floating rate after it is usually much higher, and most banks publish no margin.
  Sacombank's only published loan rates are promotions for six Vinhomes projects and VinFast cars.
  HSBC's unsecured rate is a ceiling ("không vượt quá"), its only published figure.
- **Many banks publish no loan rate at all** (LPBank, MB, SeABank, VietinBank), so the loans page
  shows them as unknown.
- **Daily and monthly rates are converted** to per year (×365 and ×12); the published form is in
  the product note.
- **The yearly banking cost is an estimate**: it counts a fee charged only below a balance as if it
  applied, and assumes 120 interbank transfers a year.

## Scoring

- **The mile value is an assumption** (100 đ per mile, from one domestic route's award price and cash fares), since no bank
  publishes one. The result page says so and lets the reader change it.
- **Spending is estimated from brackets**, not exact amounts.
- **Fee waivers count from the second year**; first-year refund rules are not scored.
- **VAT is assumed to be 10%** where a fee schedule prints fees before VAT.

## Site

- Internal links are written without a trailing slash (`/the` rather than `/the/`). In-site
  navigation is unaffected, and both hosts redirect a typed URL to the slashed form.
