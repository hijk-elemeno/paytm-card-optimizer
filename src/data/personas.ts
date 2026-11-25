import type { CardState } from './cardRules';

export interface Bill { cardId: string; dueDay: number; amount: number; minDue: number }
export interface Voucher { title: string; cardId: string; value: number; expiresInDays?: number; code?: string; note?: string }
export interface Milestone { cardId: string; kind: 'fee' | 'lounge' | 'bonus'; label: string; done: number; target: number; reward: string; deadline: string }
export interface MonthlyTxn { merchantId: string; amount: number }

export interface Persona {
  id: 'eldo' | 'nivin';
  name: string;
  blurb: string;
  quote: string;
  cards: string[];
  state: Record<string, CardState>; // what the app knows once a statement is linked (Tier 1+)
  bills: Bill[];
  vouchers: Voucher[];
  milestones: Milestone[];
  monthly: MonthlyTxn[]; // typical month, used for the spend view and upgrade maths
}

const st = (p: Partial<CardState>): CardState => ({ capUsed: {}, monthSpend: 0, monthTxnsOver1500: 0, quarterSpend: 0, annualSpend: 0, ...p });

export const PERSONAS: Persona[] = [
  {
    id: 'eldo',
    name: 'Eldo',
    blurb: '3 cards · accidental multi-card holder',
    quote: '"I booked ₹40k of flights on Millennia and found out about the ₹1,000 cap later."',
    cards: ['hdfc_millennia', 'icici_amazon', 'axis_myzone'],
    state: {
      hdfc_millennia: st({ capUsed: { partner: 0, other: 0 }, monthSpend: 11200, quarterSpend: 38000, annualSpend: 94500 }),
      icici_amazon: st({ monthSpend: 6400, quarterSpend: 21000, annualSpend: 61000 }),
      axis_myzone: st({ monthSpend: 3100, quarterSpend: 9800, annualSpend: 32000 }),
    },
    bills: [
      { cardId: 'hdfc_millennia', dueDay: 5, amount: 18240, minDue: 912 },
      { cardId: 'icici_amazon', dueDay: 14, amount: 9860, minDue: 493 },
      { cardId: 'axis_myzone', dueDay: 20, amount: 6415, minDue: 321 },
    ],
    vouchers: [
      { title: 'Buy-one-get-one movie ticket', cardId: 'axis_myzone', value: 200, note: 'Unused this month' },
      { title: 'Amazon Pay balance cashback', cardId: 'icici_amazon', value: 642, note: 'Credited, use on next Amazon order' },
    ],
    milestones: [
      { cardId: 'hdfc_millennia', kind: 'fee', label: 'Annual fee waiver', done: 94500, target: 100000, reward: 'save ₹1,180 renewal fee', deadline: 'in 14 days' },
      { cardId: 'hdfc_millennia', kind: 'lounge', label: 'Domestic lounge eligibility (this quarter)', done: 38000, target: 50000, reward: 'avoid a lounge decline next quarter', deadline: 'by 31 Dec' },
    ],
    monthly: [
      { merchantId: 'amazon', amount: 4000 }, { merchantId: 'flipkart', amount: 3000 }, { merchantId: 'myntra', amount: 2000 },
      { merchantId: 'makemytrip', amount: 8000 }, { merchantId: 'swiggy', amount: 2500 }, { merchantId: 'zomato', amount: 1500 },
      { merchantId: 'electricity', amount: 3500 }, { merchantId: 'airtel', amount: 999 }, { merchantId: 'bigbasket', amount: 4000 },
      { merchantId: 'dmart', amount: 3000 }, { merchantId: 'fuel', amount: 3000 },
    ],
  },
  {
    id: 'nivin',
    name: 'Nivin',
    blurb: '5 cards · power optimiser',
    quote: '"If it tells me to use SBI without knowing I hit my cap, I will stop using it."',
    cards: ['sbi_cashback', 'axis_airtel', 'hdfc_regalia_gold', 'amex_mrcc', 'paytm_sbi'],
    state: {
      sbi_cashback: st({ capUsed: { all: 4300 }, monthSpend: 86000, quarterSpend: 140000, annualSpend: 186000 }),
      axis_airtel: st({ capUsed: { airtel: 0, util: 0, food: 120 }, monthSpend: 2400, quarterSpend: 9000, annualSpend: 38000 }),
      hdfc_regalia_gold: st({ monthSpend: 21000, quarterSpend: 135000, annualSpend: 410000 }),
      amex_mrcc: st({ monthSpend: 4000, monthTxnsOver1500: 2, quarterSpend: 31000, annualSpend: 120000 }),
      paytm_sbi: st({ monthSpend: 3500, quarterSpend: 15000, annualSpend: 72000 }),
    },
    bills: [
      { cardId: 'sbi_cashback', dueDay: 5, amount: 31200, minDue: 1560 },
      { cardId: 'axis_airtel', dueDay: 9, amount: 4850, minDue: 243 },
      { cardId: 'hdfc_regalia_gold', dueDay: 14, amount: 46700, minDue: 2335 },
      { cardId: 'amex_mrcc', dueDay: 20, amount: 12300, minDue: 615 },
      { cardId: 'paytm_sbi', dueDay: 27, amount: 8950, minDue: 448 },
    ],
    vouchers: [
      { title: '₹1,000 milestone Amazon voucher', cardId: 'sbi_cashback', value: 1000, expiresInDays: 6, code: 'AMZ-7Q4K-NV91' },
      { title: '18,400 Regalia Gold points', cardId: 'hdfc_regalia_gold', value: 9200, expiresInDays: 41, note: 'Oldest 2,100 points lapse first' },
      { title: 'Taj Experiences voucher', cardId: 'amex_mrcc', value: 3000, expiresInDays: 63 },
    ],
    milestones: [
      { cardId: 'hdfc_regalia_gold', kind: 'bonus', label: 'Quarterly ₹1.5 lakh milestone', done: 135000, target: 150000, reward: 'earn a ₹1,500 voucher', deadline: 'by 31 Dec' },
      { cardId: 'sbi_cashback', kind: 'fee', label: 'Annual fee waiver', done: 186000, target: 200000, reward: 'save ₹1,179 renewal fee', deadline: 'in 21 days' },
      { cardId: 'amex_mrcc', kind: 'bonus', label: '₹20,000 monthly bonus', done: 4000, target: 20000, reward: 'earn 1,000 bonus points (₹500)', deadline: 'this cycle' },
    ],
    monthly: [
      { merchantId: 'amazon', amount: 6000 }, { merchantId: 'flipkart', amount: 4000 }, { merchantId: 'croma', amount: 3000 },
      { merchantId: 'makemytrip', amount: 10000 }, { merchantId: 'paytm_travel', amount: 4000 }, { merchantId: 'swiggy', amount: 3000 },
      { merchantId: 'zomato', amount: 2000 }, { merchantId: 'bigbasket', amount: 5000 }, { merchantId: 'airtel', amount: 1199 },
      { merchantId: 'electricity', amount: 4000 }, { merchantId: 'bookmyshow', amount: 1200 }, { merchantId: 'uber', amount: 2500 },
      { merchantId: 'rent', amount: 25000 }, { merchantId: 'fuel', amount: 4000 },
    ],
  },
];

export const personaById = (id: string) => PERSONAS.find((p) => p.id === id)!;
