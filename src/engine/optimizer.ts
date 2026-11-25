// Deterministic, cap-aware rules engine + a small natural-language intent parser.
// No LLM call: the same question always gets the same, auditable answer.
import { CARDS, MERCHANTS, cardById, emptyState, type CalcResult, type CardRule, type CardState, type Category, type Merchant } from '../data/cardRules';
import type { MonthlyTxn } from '../data/personas';

export interface ParsedQuery { amount: number | null; merchant: Merchant | null; categoryHint: Category | null; raw: string }

const CATEGORY_WORDS: [RegExp, Category][] = [
  [/\brent\b/, 'rent'],
  [/\b(fuel|petrol|diesel)\b/, 'fuel'],
  [/\b(electricity|water bill|gas bill|utility|utilities)\b/, 'utilities'],
  [/\b(flight|flights|airfare)\b/, 'flights'],
  [/\b(hotel|hotels|stay)\b/, 'hotels'],
  [/\b(dining|restaurant|dinner|lunch)\b/, 'dining'],
  [/\b(grocery|groceries)\b/, 'groceries'],
  [/\b(electronics|laptop|phone|tv)\b/, 'electronics'],
  [/\b(movie|movies|cinema)\b/, 'movies'],
];

export function parseQuery(text: string): ParsedQuery {
  const t = text.toLowerCase().replace(/\s+/g, ' ');
  let amount: number | null = null;
  const m = t.match(/(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|lakh|lac|l)?\b/);
  if (m) {
    amount = parseFloat(m[1].replace(/,/g, ''));
    const u = m[2];
    if (u === 'k') amount *= 1000;
    else if (u) amount *= 100000;
  }
  const aliases = MERCHANTS.flatMap((mer) => mer.aliases.map((a) => ({ a, mer }))).sort((x, y) => y.a.length - x.a.length);
  const hit = aliases.find(({ a }) => new RegExp(`(^|[^a-z])${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(t));
  let categoryHint: Category | null = null;
  for (const [re, c] of CATEGORY_WORDS) if (re.test(t)) { categoryHint = c; break; }
  return { amount, merchant: hit?.mer ?? null, categoryHint, raw: text };
}

export interface Ranked { card: CardRule; calc: CalcResult; effective: number }
export type Outcome =
  | { kind: 'ranked'; merchant: Merchant; amount: number; ranked: Ranked[]; liveCaps: boolean }
  | { kind: 'excluded'; merchant: Merchant; amount: number; ranked: Ranked[] }
  | { kind: 'unverified'; amount: number; label: string; ranked: Ranked[] }
  | { kind: 'need_amount' };

const GENERIC_BY_CATEGORY: Partial<Record<Category, string>> = { rent: 'rent', fuel: 'fuel', utilities: 'electricity' };

export function recommend(q: ParsedQuery, cardIds: string[], states: Record<string, CardState> | null): Outcome {
  if (!q.amount || q.amount <= 0) return { kind: 'need_amount' };
  const amount = Math.round(q.amount);
  const cards = cardIds.map(cardById);
  let merchant = q.merchant;
  if (!merchant && q.categoryHint && GENERIC_BY_CATEGORY[q.categoryHint]) merchant = MERCHANTS.find((x) => x.id === GENERIC_BY_CATEGORY[q.categoryHint!])!;

  if (!merchant) {
    // Unknown merchant: do not guess the MCC; rank by the base rate every card pays anywhere.
    const ranked = cards
      .map((card) => {
        const v = amount * card.baseRate;
        return { card, effective: card.baseRate, calc: { value: v, excluded: false, caps: [], formula: [`What it gives anywhere (${card.baseLabel}) × ₹${amount.toLocaleString('en-IN')} = ₹${Math.round(v).toLocaleString('en-IN')}`] } };
      })
      .sort((a, b) => b.calc.value - a.calc.value)
      .slice(0, 2);
    const label = q.raw.replace(/(?:₹|rs\.?|inr)?\s*\d[\d,]*(?:\.\d+)?\s*(k|lakh|lac|l)?\b/i, '').replace(/^\s*(at|on|for)\s+/i, '').trim() || 'this merchant';
    return { kind: 'unverified', amount, label, ranked };
  }

  const ranked = cards
    .map((card) => {
      const s = states?.[card.id] ?? emptyState();
      const calc = card.compute(amount, merchant!, s);
      return { card, calc, effective: calc.value / amount };
    })
    .sort((a, b) => b.calc.value - a.calc.value);

  if (ranked.every((x) => x.calc.excluded || x.calc.value === 0)) return { kind: 'excluded', merchant, amount, ranked };
  return { kind: 'ranked', merchant, amount, ranked, liveCaps: !!states };
}

// ---- Upgrade maths: replay a persona's typical month with and without a new card ----
// Each transaction goes to the card that pays the most at that moment, and that card's caps fill up.
function bestOfMonth(cardIds: string[], monthly: MonthlyTxn[]) {
  const states: Record<string, CardState> = Object.fromEntries(cardIds.map((id) => [id, emptyState()]));
  let total = 0;
  for (const t of monthly) {
    const m = MERCHANTS.find((x) => x.id === t.merchantId)!;
    let best: { id: string; calc: CalcResult } | null = null;
    for (const id of cardIds) {
      const calc = cardById(id).compute(t.amount, m, states[id]);
      if (!best || calc.value > best.calc.value) best = { id, calc };
    }
    if (!best || best.calc.value <= 0) continue;
    total += best.calc.value;
    const s = states[best.id];
    for (const c of best.calc.caps) s.capUsed[c.bucket] = c.usedAfter;
    s.monthSpend += t.amount;
    if (t.amount >= 1500) s.monthTxnsOver1500 += 1;
  }
  return total;
}

export interface UpgradeOption { card: CardRule; currentSixMonth: number; withCardSixMonth: number; netSixMonth: number; netAnnual: number }

export function upgradeOptions(held: string[], monthly: MonthlyTxn[]): UpgradeOption[] {
  const current = bestOfMonth(held, monthly) * 6;
  return CARDS.filter((c) => !held.includes(c.id))
    .map((card) => {
      const withCard = bestOfMonth([...held, card.id], monthly) * 6;
      const netSix = withCard - current - card.annualFee / 2;
      return { card, currentSixMonth: current, withCardSixMonth: withCard, netSixMonth: netSix, netAnnual: netSix * 2 };
    })
    .sort((a, b) => b.netSixMonth - a.netSixMonth);
}

export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
export const pctStr = (x: number) => (x * 100).toFixed(1) + '%';
