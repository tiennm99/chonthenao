# Questionnaire and scoring

The "Tìm thẻ cho tôi" page (`/goi-y/`) asks at most 20 questions, each with 2 to 4 answers, and
ranks credit and debit cards by an estimated yearly value. The questions live in `src/lib/quiz.js`, the math in
`src/lib/scoring.js`; tests assert the caps.

## Flow

- Order: goal, card kind, income, monthly spend, foreign spend, one question per spending
  category, virtual card, current bank.
- The card-kind question (thẻ tín dụng, thẻ ghi nợ, cái nào cũng được) comes right after the goal,
  only while cards of both kinds remain. Picking one kind keeps only those cards.
- Income is asked only while a credit card remains, since banks set no income minimum for a debit
  card; a debit card never fails the income filter or gets the income warning.
- A reader who carries a balance gets credit cards only, since only a credit card lets a balance
  roll over, and is asked only their income.
- A question is skipped when it cannot change the result: a category no remaining card rewards,
  the virtual-card question when all remaining cards agree, the bank question when the top cards
  share one bank.
- The quiz ends as soon as one card or none fits (miles with a credit card ends it after two
  questions today), and "Xem kết quả ngay" ends it any time after the spend question.
- Spending is asked in brackets, not typed amounts. The estimate uses 3, 7,5, 15 or 30 million
  đồng per month; a category answer is 0%, about 10% or about 30% of that, foreign spend 0%, 3% or
  15%. Shares above 90% are scaled down, and the rest counts as other spend.

## Estimate

Yearly value = rewards − annual fee − foreign fees, the same formula for both card kinds. Scoring
never reads the credit-only fields, so for "tốn ít phí nhất" debit and credit cards compete on the
same terms. Each result shows its kind, and the top card's kind is stated when the reader chose
"cái nào cũng được".

- Each spend bucket lands on the card's reward for that category, else its base rate. A card that
  limits bonus categories (`maxCategories`) uses the reader's best ones.
- Caps apply once per reward, then shared caps. Below `minSpendMonth` the card earns nothing.
- Points use the bank's published value. Miles have none, so the site assumes
  `ASSUMED_MILE_VND` (100 đ per mile), says so on the result, and lets the reader change it. The
  figure comes from Vietnam Airlines' own data: a Hà Nội – TP.HCM economy award costs 11.000
  miles one way in regular season and 15.000 in peak
  ([award chart](https://www.vietnamairlines.com/content/dam/vna/vna-assets/global/documents/lotusmiles/redeem/VI_AwardTicket.pdf)),
  against a one-way cash fare from 888.181 to 1.494.000 đ
  ([route page](https://www.vietnamairlines.com/vi-vn/vé-máy-bay-từ-hà-nội-đến-tp-hồ-chí-minh)),
  so about 60 to 136 đ per mile. Miles do not pay an award's taxes and fees
  ([redemption rules](https://www.vietnamairlines.com/vn/vi/lotusmile/redeem-mile/ticket-awards/how-to-redeem-miles)),
  which pushes the real value lower. The airline's selling price for miles (550 đ before VAT) is
  what a mile costs to buy, not what it returns, so the site does not use it.
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
