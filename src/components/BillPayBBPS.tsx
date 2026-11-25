import { useState } from 'react';
import { BellRing, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { cardById } from '../data/cardRules';
import { inr } from '../engine/optimizer';
import { DEMO_DATE_LABEL, DEMO_DAY, maskOf } from '../types';
import type { AppState } from '../App';

export default function BillPayBBPS({ state, onPaid }: { state: AppState; onPaid: (cardId: string, ref: string) => void }) {
  const [paying, setPaying] = useState<string | null>(null);
  const bills = state.persona.bills.filter((b) => state.selectedCards.includes(b.cardId)).sort((a, b) => a.dueDay - b.dueDay);

  const pay = (cardId: string) => {
    setPaying(cardId);
    window.setTimeout(() => {
      setPaying(null);
      onPaid(cardId, 'BBPS' + String(Math.abs(cardId.split('').reduce((h, c) => h * 7 + c.charCodeAt(0), 11)) % 1e8).padStart(8, '0'));
    }, 900);
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-navy">Bills due · all cards</h2>
        <span className="text-[11px] text-gray-500">Today: {DEMO_DATE_LABEL}</span>
      </div>
      <div className="mt-2 flex items-start gap-2 rounded-xl bg-cyan-tint p-2.5 text-xs text-navy">
        <Info size={14} className="mt-0.5 shrink-0" />
        Bharat Connect (BBPS) settles in 24–48 hrs. Pay by T-4 days to avoid late fees.
      </div>
      {bills.length === 0 && <p className="mt-3 text-sm text-gray-500">No bills fetched for these cards yet.</p>}
      <ol className="relative mt-3 space-y-3 border-l-2 border-gray-100 pl-4">
        {bills.map((b) => {
          const card = cardById(b.cardId);
          const left = b.dueDay - DEMO_DAY;
          const urgent = left <= 4;
          const ref = state.paid[b.cardId];
          return (
            <li key={b.cardId} className="relative">
              <span className={`absolute -left-[23px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${ref ? 'bg-ok' : urgent ? 'bg-alert' : 'bg-gray-300'}`} />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{card.name} <span className="font-normal text-gray-500">{maskOf(card.id)}</span></div>
                  <div className="text-xs text-gray-500">Due {b.dueDay} Dec · {left} days left · min due {inr(b.minDue)}</div>
                </div>
                <div className="tnum text-sm font-semibold">{inr(b.amount)}</div>
              </div>
              {urgent && !ref && (
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-alert">
                  <BellRing size={12} /> T-4 smart nudge: pay today so it settles in time
                </div>
              )}
              {ref ? (
                <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-ok">
                  <CheckCircle2 size={14} /> Paid {inr(b.amount)} · Ref {ref} · reaches {card.issuer} in 24–48 hrs
                </div>
              ) : (
                <button onClick={() => pay(b.cardId)} disabled={paying !== null}
                  className={`mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold ${urgent ? 'bg-navy text-white' : 'border border-navy text-navy'} disabled:opacity-60`}>
                  {paying === b.cardId ? <><Loader2 size={15} className="animate-spin" /> Paying…</> : <>Pay {inr(b.amount)} via Paytm UPI</>}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
