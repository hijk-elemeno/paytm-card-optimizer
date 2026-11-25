// Card rules catalogue. Simplified from issuers' public reward pages for a prototype;
// every rupee shown in the app is computed from these rules, never generated text.

export type Category =
  | 'flights' | 'hotels' | 'online_shopping' | 'electronics' | 'dining' | 'food_delivery'
  | 'groceries' | 'utilities' | 'telecom' | 'movies' | 'cabs' | 'rent' | 'fuel' | 'wallet' | 'unknown';

export interface Merchant {
  id: string;
  name: string;
  aliases: string[];
  category: Category;
  channel: 'online' | 'offline';
  mcc: string;
  paytm?: boolean;
}

export const MERCHANTS: Merchant[] = [
  { id: 'amazon', name: 'Amazon', aliases: ['amazon'], category: 'online_shopping', channel: 'online', mcc: '5399' },
  { id: 'flipkart', name: 'Flipkart', aliases: ['flipkart'], category: 'online_shopping', channel: 'online', mcc: '5399' },
  { id: 'myntra', name: 'Myntra', aliases: ['myntra'], category: 'online_shopping', channel: 'online', mcc: '5651' },
  { id: 'makemytrip', name: 'MakeMyTrip', aliases: ['makemytrip', 'make my trip', 'mmt'], category: 'flights', channel: 'online', mcc: '4722' },
  { id: 'paytm_travel', name: 'Paytm Travel', aliases: ['paytm travel', 'paytm flights', 'paytm flight'], category: 'flights', channel: 'online', mcc: '4722', paytm: true },
  { id: 'paytm_movies', name: 'Paytm Movies', aliases: ['paytm movies', 'paytm movie'], category: 'movies', channel: 'online', mcc: '7832', paytm: true },
  { id: 'swiggy_dineout', name: 'Swiggy Dineout', aliases: ['swiggy dineout', 'dineout'], category: 'dining', channel: 'online', mcc: '5812' },
  { id: 'swiggy', name: 'Swiggy', aliases: ['swiggy'], category: 'food_delivery', channel: 'online', mcc: '5814' },
  { id: 'zomato', name: 'Zomato', aliases: ['zomato'], category: 'food_delivery', channel: 'online', mcc: '5814' },
  { id: 'croma', name: 'Croma', aliases: ['croma'], category: 'electronics', channel: 'online', mcc: '5732' },
  { id: 'bigbasket', name: 'BigBasket', aliases: ['bigbasket', 'big basket'], category: 'groceries', channel: 'online', mcc: '5411' },
  { id: 'dmart', name: 'DMart', aliases: ['dmart', 'd-mart', 'd mart'], category: 'groceries', channel: 'offline', mcc: '5411' },
  { id: 'airtel', name: 'Airtel', aliases: ['airtel'], category: 'telecom', channel: 'online', mcc: '4814' },
  { id: 'electricity', name: 'Electricity bill', aliases: ['electricity', 'power bill', 'bescom', 'tata power'], category: 'utilities', channel: 'online', mcc: '4900' },
  { id: 'bookmyshow', name: 'BookMyShow', aliases: ['bookmyshow', 'book my show', 'bms'], category: 'movies', channel: 'online', mcc: '7832' },
  { id: 'uber', name: 'Uber', aliases: ['uber'], category: 'cabs', channel: 'online', mcc: '4121' },
  { id: 'rent', name: 'Rent payment', aliases: ['rent'], category: 'rent', channel: 'online', mcc: '6513' },
  { id: 'fuel', name: 'Fuel station', aliases: ['fuel', 'petrol', 'diesel', 'hpcl', 'iocl', 'indian oil'], category: 'fuel', channel: 'offline', mcc: '5541' },
  { id: 'wallet', name: 'Wallet load', aliases: ['wallet load', 'wallet top'], category: 'wallet', channel: 'online', mcc: '6540' },
];

export interface CardState {
  capUsed: Record<string, number>; // cap bucket -> reward already earned this cycle (₹)
  monthSpend: number;
  monthTxnsOver1500: number;
  quarterSpend: number;
  annualSpend: number;
}
export const emptyState = (): CardState => ({ capUsed: {}, monthSpend: 0, monthTxnsOver1500: 0, quarterSpend: 0, annualSpend: 0 });

export interface CapInfo { bucket: string; label: string; cap: number; usedBefore: number; usedAfter: number; hitAt?: number }
export interface CalcResult {
  value: number;
  excluded: boolean;
  formula: string[];
  caps: CapInfo[];
  milestone?: string;
}

export interface CardRule {
  id: string;
  name: string;
  issuer: string;
  color: string; // card art gradient start
  annualFee: number; // incl. GST
  feeWaiverSpend?: number;
  lounge?: string;
  perks: string[]; // plain-English perk decoder
  exclusions: Category[];
  baseLabel: string; // rate used for unknown merchants
  baseRate: number;
  compute: (amount: number, m: Merchant, s: CardState) => CalcResult;
}

const r = (n: number) => Math.round(n);
const pct = (x: number) => `${(x * 100).toFixed(x * 100 % 1 === 0 ? 0 : 2)}%`;

// Earn `rate` on amount, limited by a monthly reward cap bucket.
function capped(amount: number, rate: number, bucket: string, cap: number, s: CardState, label: string) {
  const usedBefore = s.capUsed[bucket] ?? 0;
  const raw = amount * rate;
  const room = Math.max(0, cap - usedBefore);
  const earned = Math.min(raw, room);
  const info: CapInfo = { bucket, label, cap, usedBefore, usedAfter: usedBefore + earned };
  if (raw > room) info.hitAt = r(room / rate);
  return { earned, info, line: `${pct(rate)} × ₹${amount.toLocaleString('en-IN')} = ₹${r(raw).toLocaleString('en-IN')}${raw > room ? `, limited to ₹${r(room).toLocaleString('en-IN')} left in the ₹${cap.toLocaleString('en-IN')} ${label}` : ''}` };
}

function excludedResult(m: Merchant, card: string): CalcResult {
  return { value: 0, excluded: true, formula: [`${card} earns nothing on ${m.name} (MCC ${m.mcc} is excluded in the card's terms)`], caps: [] };
}

const MILLENNIA_PARTNERS = ['amazon', 'flipkart', 'makemytrip', 'swiggy', 'swiggy_dineout', 'zomato', 'myntra', 'bookmyshow', 'uber'];

export const CARDS: CardRule[] = [
  {
    id: 'hdfc_millennia', name: 'HDFC Millennia', issuer: 'HDFC Bank', color: '#1E3A8A', annualFee: 1180, feeWaiverSpend: 100000,
    lounge: 'Domestic lounge needs ₹50,000 spend in the previous quarter',
    perks: ['5% cashback on 10 partner brands (Amazon, Flipkart, MakeMyTrip, Swiggy, Zomato and more), max ₹1,000 a month', '1% on other spends, max ₹1,000 a month', 'Annual fee ₹1,000 + GST waived at ₹1 lakh yearly spend', 'No cashback on rent, fuel or wallet loads'],
    exclusions: ['rent', 'fuel', 'wallet'], baseLabel: '1% other spends', baseRate: 0.01,
    compute(amount, m, s) {
      if (this.exclusions.includes(m.category)) return excludedResult(m, this.name);
      if (MILLENNIA_PARTNERS.includes(m.id)) {
        const c = capped(amount, 0.05, 'partner', 1000, s, 'monthly partner cap');
        return { value: c.earned, excluded: false, formula: [`Partner merchant: ${c.line}`], caps: [c.info] };
      }
      const c = capped(amount, 0.01, 'other', 1000, s, 'monthly cap on other spends');
      return { value: c.earned, excluded: false, formula: [`Other spends: ${c.line}`], caps: [c.info] };
    },
  },
  {
    id: 'sbi_cashback', name: 'SBI Cashback', issuer: 'SBI Card', color: '#0F766E', annualFee: 1179, feeWaiverSpend: 200000,
    perks: ['5% cashback on all online spends, 1% offline', 'Total cashback capped at ₹5,000 per statement cycle', 'No cashback on rent, utilities, fuel, insurance or wallet loads', 'Fee ₹999 + GST waived at ₹2 lakh yearly spend'],
    exclusions: ['rent', 'utilities', 'fuel', 'wallet'], baseLabel: '1% offline', baseRate: 0.01,
    compute(amount, m, s) {
      if (this.exclusions.includes(m.category)) return excludedResult(m, this.name);
      const rate = m.channel === 'online' ? 0.05 : 0.01;
      const c = capped(amount, rate, 'all', 5000, s, 'monthly cashback cap');
      return { value: c.earned, excluded: false, formula: [`${m.channel === 'online' ? 'Online' : 'Offline'} spend: ${c.line}`], caps: [c.info] };
    },
  },
  {
    id: 'icici_amazon', name: 'ICICI Amazon Pay', issuer: 'ICICI Bank', color: '#B45309', annualFee: 0,
    perks: ['5% back on Amazon for Prime members, no cap', '2% on Amazon Pay partner merchants and bill payments', '1% on other spends', 'Lifetime free; nothing on rent or fuel'],
    exclusions: ['rent', 'fuel', 'wallet'], baseLabel: '1% other spends', baseRate: 0.01,
    compute(amount, m) {
      if (this.exclusions.includes(m.category)) return excludedResult(m, this.name);
      let rate = 0.01, why = 'Other spends';
      if (m.id === 'amazon') { rate = 0.05; why = 'Amazon (Prime)'; }
      else if (['utilities', 'telecom'].includes(m.category) || ['swiggy', 'bookmyshow'].includes(m.id)) { rate = 0.02; why = 'Bill payment / Amazon Pay partner'; }
      const v = amount * rate;
      return { value: v, excluded: false, formula: [`${why}: ${pct(rate)} × ₹${amount.toLocaleString('en-IN')} = ₹${r(v).toLocaleString('en-IN')} (no cap)`], caps: [] };
    },
  },
  {
    id: 'axis_myzone', name: 'Axis My Zone', issuer: 'Axis Bank', color: '#7F1D1D', annualFee: 590,
    perks: ['4 EDGE points per ₹200 (about 0.4% back)', 'Buy-one-get-one movie ticket up to ₹200 once a month', 'No points on rent, fuel or wallet loads'],
    exclusions: ['rent', 'fuel', 'wallet'], baseLabel: '0.4% (EDGE points)', baseRate: 0.004,
    compute(amount, m, s) {
      if (this.exclusions.includes(m.category)) return excludedResult(m, this.name);
      const pts = Math.floor(amount / 200) * 4;
      let v = pts * 0.2;
      const f = [`${pts} EDGE points (4 per ₹200) × ₹0.20 = ₹${r(v).toLocaleString('en-IN')}`];
      if (m.category === 'movies' && !(s.capUsed['bogo'] ?? 0)) { const b = Math.min(200, amount / 2); v += b; f.push(`Movie BOGO benefit: + ₹${r(b)}`); }
      return { value: v, excluded: false, formula: f, caps: [] };
    },
  },
  {
    id: 'paytm_sbi', name: 'Paytm SBI Card', issuer: 'SBI Card', color: '#0369A1', annualFee: 1179, feeWaiverSpend: 100000,
    perks: ['3% on Paytm Travel, Movies and Mini Apps', '2% on other spends in the Paytm app', '1% everywhere else', 'Milestone benefit at ₹1 lakh yearly spend'],
    exclusions: ['rent', 'fuel', 'wallet'], baseLabel: '1% elsewhere', baseRate: 0.01,
    compute(amount, m) {
      if (this.exclusions.includes(m.category)) return excludedResult(m, this.name);
      let rate = 0.01, why = 'Outside Paytm';
      if (m.paytm && ['flights', 'hotels', 'movies'].includes(m.category)) { rate = 0.03; why = 'Paytm Travel / Movies'; }
      else if (m.paytm) { rate = 0.02; why = 'Paytm app'; }
      const v = amount * rate;
      return { value: v, excluded: false, formula: [`${why}: ${pct(rate)} × ₹${amount.toLocaleString('en-IN')} = ₹${r(v).toLocaleString('en-IN')}`], caps: [] };
    },
  },
  {
    id: 'axis_airtel', name: 'Axis Airtel', issuer: 'Axis Bank', color: '#B91C1C', annualFee: 590,
    perks: ['25% back on Airtel bills, max ₹250 a month', '10% on utility bills via Airtel Thanks, max ₹250 a month', '10% on Swiggy, Zomato, BigBasket, max ₹500 a month', '1% on other spends'],
    exclusions: ['rent', 'fuel', 'wallet'], baseLabel: '1% other spends', baseRate: 0.01,
    compute(amount, m, s) {
      if (this.exclusions.includes(m.category)) return excludedResult(m, this.name);
      let c;
      if (m.id === 'airtel') c = capped(amount, 0.25, 'airtel', 250, s, 'monthly Airtel cap');
      else if (m.category === 'utilities') c = capped(amount, 0.10, 'util', 250, s, 'monthly utilities cap');
      else if (['swiggy', 'swiggy_dineout', 'zomato', 'bigbasket'].includes(m.id)) c = capped(amount, 0.10, 'food', 500, s, 'monthly food and grocery cap');
      if (c) return { value: c.earned, excluded: false, formula: [c.line], caps: [c.info] };
      const v = amount * 0.01;
      return { value: v, excluded: false, formula: [`Other spends: 1% × ₹${amount.toLocaleString('en-IN')} = ₹${r(v).toLocaleString('en-IN')}`], caps: [] };
    },
  },
  {
    id: 'hdfc_regalia_gold', name: 'HDFC Regalia Gold', issuer: 'HDFC Bank', color: '#78350F', annualFee: 2950, feeWaiverSpend: 400000,
    lounge: 'Domestic and international lounge access included',
    perks: ['4 reward points per ₹150 (about 1.3% back at ₹0.50 a point)', '₹1,500 voucher for every ₹1.5 lakh spent in a quarter', 'Lounge access included', 'No points on rent or fuel'],
    exclusions: ['rent', 'fuel', 'wallet'], baseLabel: '1.3% (reward points)', baseRate: 0.0133,
    compute(amount, m, s) {
      if (this.exclusions.includes(m.category)) return excludedResult(m, this.name);
      const pts = Math.floor(amount / 150) * 4;
      let v = pts * 0.5;
      const f = [`${pts} points (4 per ₹150) × ₹0.50 = ₹${r(v).toLocaleString('en-IN')}`];
      let milestone: string | undefined;
      if (s.quarterSpend > 0 && s.quarterSpend < 150000 && s.quarterSpend + amount >= 150000) {
        v += 1500;
        milestone = `Crosses the ₹1.5 lakh quarterly milestone (₹${s.quarterSpend.toLocaleString('en-IN')} spent so far): + ₹1,500 voucher`;
        f.push(milestone);
      }
      return { value: v, excluded: false, formula: f, caps: [], milestone };
    },
  },
  {
    id: 'amex_mrcc', name: 'Amex MRCC', issuer: 'American Express', color: '#1F2937', annualFee: 1770,
    perks: ['1 Membership Rewards point per ₹50 (about 1% at ₹0.50 a point)', '1,000 bonus points for 4 transactions of ₹1,500+ in a month', '1,000 bonus points on ₹20,000 monthly spend', 'No points on fuel, utilities, insurance or rent'],
    exclusions: ['rent', 'fuel', 'utilities', 'wallet'], baseLabel: '1% (MR points)', baseRate: 0.01,
    compute(amount, m, s) {
      if (this.exclusions.includes(m.category)) return excludedResult(m, this.name);
      const pts = Math.floor(amount / 50);
      let v = pts * 0.5;
      const f = [`${pts} points (1 per ₹50) × ₹0.50 = ₹${r(v).toLocaleString('en-IN')}`];
      let milestone: string | undefined;
      if (amount >= 1500 && s.monthTxnsOver1500 === 3) { v += 500; f.push('4th transaction of ₹1,500+ this month: + 1,000 points (₹500)'); milestone = '4-transaction bonus'; }
      if (s.monthSpend > 0 && s.monthSpend < 20000 && s.monthSpend + amount >= 20000) { v += 500; f.push(`Crosses ₹20,000 monthly spend (₹${s.monthSpend.toLocaleString('en-IN')} so far): + 1,000 points (₹500)`); milestone = '₹20,000 monthly bonus'; }
      return { value: v, excluded: false, formula: f, caps: [], milestone };
    },
  },
];

export const cardById = (id: string) => CARDS.find((c) => c.id === id)!;
export const RULES_VERIFIED = 'Nov 2026';
