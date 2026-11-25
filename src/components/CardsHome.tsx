import { ChevronRight, Gift, Lock } from 'lucide-react';
import { MERCHANTS, cardById } from '../data/cardRules';
import { pctStr, recommend } from '../engine/optimizer';
import { maskOf, type Tab } from '../types';
import type { AppState } from '../App';
import BillPayBBPS from './BillPayBBPS';

const BROWSE: { label: string; merchantId: string }[] = [
  { label: 'Online shopping', merchantId: 'flipkart' },
  { label: 'Amazon', merchantId: 'amazon' },
  { label: 'Flights', merchantId: 'makemytrip' },
  { label: 'Food delivery', merchantId: 'zomato' },
  { label: 'Groceries (store)', merchantId: 'dmart' },
  { label: 'Electricity bill', merchantId: 'electricity' },
  { label: 'Fuel', merchantId: 'fuel' },
];

interface Props {
  state: AppState;
  onAsk: (q: string) => void;
  onUnlock: () => void;
  onTab: (t: Tab) => void;
  onPaid: (cardId: string, ref: string) => void;
}

export default function CardsHome({ state, onAsk, onUnlock, onTab, onPaid }: Props) {
  const states = state.tier > 0 ? state.persona.state : null;
  const urgentVoucher = state.tier > 0 ? state.persona.vouchers.filter((v) => v.expiresInDays !== undefined).sort((a, b) => a.expiresInDays! - b.expiresInDays!)[0] : undefined;

  const nextGap = state.tier > 0 ? state.persona.milestones.find((m) => m.kind === 'fee') : undefined;

  return (
    <div className="space-y-4 p-4">
      <section>
        <h2 className="mb-2 font-semibold text-navy">My cards ({state.selectedCards.length})</h2>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
          {state.selectedCards.map((id) => {
            const c = cardById(id);
            return (
              <div key={id} className="h-[92px] w-[150px] shrink-0 rounded-2xl p-3 text-white shadow" style={{ background: `linear-gradient(135deg, ${c.color}, #0b1220)` }}>
                <div className="text-[10px] text-white/70">{c.issuer}</div>
                <div className="text-sm font-semibold leading-tight">{c.name}</div>
                <div className="mt-3 text-xs tracking-wider text-white/80">{maskOf(id)}</div>
              </div>
            );
          })}
        </div>
      </section>

      {!urgentVoucher && nextGap ? (
        <button onClick={() => onTab('rewards')} className="flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left text-sm">
          <Gift size={20} className="text-warn" />
          <span className="flex-1"><b>{cardById(nextGap.cardId).name} {nextGap.label.toLowerCase()}:</b> ₹{(nextGap.target - nextGap.done).toLocaleString('en-IN')} to go {nextGap.deadline}</span>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      ) : urgentVoucher ? (
        <button onClick={() => onTab('rewards')} className="flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left text-sm">
          <Gift size={20} className="text-warn" />
          <span className="flex-1"><b>{urgentVoucher.title}</b> expires in {urgentVoucher.expiresInDays} days</span>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      ) : (
        <button onClick={onUnlock} className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white p-3 text-left text-sm text-gray-600">
          <Lock size={18} className="text-navy" />
          <span className="flex-1">Add a statement to see expiring points, vouchers and spend goals</span>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      )}

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-navy">Best card by category</h2>
          <span className="text-[11px] text-gray-500">{states ? 'after this month\'s limits' : 'money back on ₹5,000'}</span>
        </div>
        <ul className="mt-2 divide-y divide-gray-100">
          {BROWSE.map(({ label, merchantId }) => {
            const m = MERCHANTS.find((x) => x.id === merchantId)!;
            const o = recommend({ amount: 5000, merchant: m, categoryHint: null, raw: '' }, state.selectedCards, states);
            const top = o.kind === 'ranked' ? o.ranked[0] : null;
            return (
              <li key={label}>
                <button onClick={() => onAsk(`₹5,000 at ${m.name}`)} className="flex w-full items-center justify-between py-2.5 text-left text-sm">
                  <span className="text-gray-700">{label}</span>
                  <span className="flex items-center gap-1.5">
                    {top ? <><span className="font-medium">{top.card.name}</span><span className="tnum rounded-full bg-cyan-tint px-2 py-0.5 text-xs font-semibold text-navy">{pctStr(top.effective)}</span></>
                      : <span className="text-xs text-gray-500">No card earns here</span>}
                    <ChevronRight size={15} className="text-gray-300" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-1 text-[11px] text-gray-500">Tap a row to see how we worked it out.</p>
      </section>

      <BillPayBBPS state={state} onPaid={onPaid} />
    </div>
  );
}
