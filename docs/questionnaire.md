# Questionnaire and scoring

The "Tìm thẻ cho tôi" page (`/goi-y/`) asks at most 20 questions, each with 2 to 4 answers, and
ranks cards by an estimated yearly value. The questions live in `src/lib/quiz.js`, the math in
`src/lib/scoring.js`; tests assert the caps.

## Flow

- Order: goal, income, monthly spend, foreign spend, one question per spending category, virtual
  card, current bank.
- A question is skipped when it cannot change the result: a category no remaining card rewards,
  the virtual-card question when all remaining cards agree, the bank question when the top cards
  share one bank. A reader who carries a balance is asked only their income.
- The quiz ends as soon as one card or none fits (choosing miles ends it after one question
  today), and "Xem kết quả ngay" ends it any time after the spend question.
- Spending is asked in brackets, not typed amounts. The estimate uses 3, 7,5, 15 or 30 million
  đồng per month; a category answer is 0%, about 10% or about 30% of that, foreign spend 0%, 3% or
  15%. Shares above 90% are scaled down, and the rest counts as other spend.

## Estimate

Yearly value = rewards − annual fee − foreign fees.

- Each spend bucket lands on the card's reward for that category, else its base rate. A card that
  limits bonus categories (`maxCategories`) uses the reader's best ones.
- Caps apply once per reward, then shared caps. Below `minSpendMonth` the card earns nothing.
- Points use the bank's published value. Miles have none, so the site assumes
  `ASSUMED_MILE_VND` (200 đ per mile), says so on the result, and lets the reader change it.
- A fee printed before VAT gets 10% added. A fee waiver counts, as "từ năm 2", when the yearly
  spend reaches its threshold. An unknown fee, or foreign spend with an unknown foreign fee,
  leaves the value unknown and sorts it last.
- Cards whose reward terms have expired (`rewardsUntil`) rank after the rest, with a warning.
- Goals: cashback and miles rank by value; "tốn ít phí nhất" by yearly cost, then value; a reader
  who carries a balance gets cards by interest rate with a warning.
- The bank suggestion is the top card's bank. If the reader uses another bank among the top
  issuers, the page also shows that bank's best card and the difference. It never changes the
  order.

The ranking code reads cards and answers only, never bank records, so a referral link cannot
change it; a test checks this.
