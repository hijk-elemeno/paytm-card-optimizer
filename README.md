# Card Optimizer: Paytm PM case study prototype

Companion prototype for **Paytm PM Campus Case 3: Credit Card Spends Analyzer** (Eashani Das).
This is a case study prototype. It is not a Paytm product, and every card, cap and spend in it is sample data, simplified from public issuer pages.

## What it shows (mirrors the deck's V1 journey)

| Deck screen | In the app |
|---|---|
| 1. Entry on credit card bill pay | Bill-pay screen with "Your cards could earn more → Check my cards" |
| 2. Add cards, Tier 0 (names only) | Card pills, "Zero Gmail/SMS Access • Zero Sales-Call Pledge" |
| 3. Cards home | My cards, best card by category, expiring voucher, BBPS dues with a reminder to pay 4 days early |
| 4. Ask "Which card for this?" | Cap-aware answer with ₹ and %, Why not #2, calculation proof, rule date, Verify / Report error |
| 5. Insights, Tier 1 (statement PDF) | Sample PDF with on-device redaction, then spends chart, fee-waiver and lounge bars, milestone router, expiry vault |
| 6. Consent centre | Tier 0/1/2 status, AA consent artefact (Tier 2), Zero Sales-Call toggle, Erase all my data |
| V2 (COULD) | Opt-in upgrade maths, shown only when the net saving is above ₹3,000 a year |

## Design choices
- **Rules engine for every rupee** (`src/engine/optimizer.ts`, `src/data/cardRules.ts`). There is no LLM call, so the link works with no API key, and the same question always gets the same answer. In production an LLM would only parse intent and phrase the answer.
- **Caps and exclusions are modelled**: Millennia's ₹1,000 partner cap, SBI Cashback's ₹5,000 cap, Axis Airtel's category caps, and Regalia and Amex milestones. Rent, fuel and wallet are excluded.
- If a merchant is unknown, the app does not guess its MCC. It shows the top 2 cards by base rate.

## Demo in 30 seconds
1. **Eldo, Tier 0:** tap **₹40,000 flights on MakeMyTrip**. Millennia hits its ₹1,000 cap at ₹20,000, so it earns 2.5%.
2. **Rewards:** tap **Use sample statement PDF**. You see the redaction, the ₹5,500 fee-waiver gap, and the lounge gap of ₹12,000.
3. **Nivin, Tier 1:** tap **₹18,000 electronics at Croma**. SBI has only ₹700 of cap left, so Regalia Gold wins at ₹1,740 because this spend crosses its milestone.
4. **Privacy:** tap **Erase all my data**. The app is back at Tier 0.

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
```

## Deploy
Import the repo at vercel.com/new. Vercel detects Vite (build `npm run build`, output `dist`).
