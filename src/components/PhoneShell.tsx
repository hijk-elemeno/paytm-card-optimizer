import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronRight, Presentation, RotateCcw, X } from 'lucide-react';
import type { Tier } from '../types';

interface Props {
  personaId: 'eldo' | 'nivin';
  tier: Tier;
  onPersona: (id: 'eldo' | 'nivin') => void;
  onTier: (t: Tier) => void;
  onReset: () => void;
  overlay: ReactNode;
  scrollKey: string;
  nav: ReactNode;
  children: ReactNode;
}

const TIERS: { t: Tier; name: string; sub: string }[] = [
  { t: 0, name: 'Tier 0', sub: 'Zero-data (card names)' },
  { t: 1, name: 'Tier 1', sub: 'PDF statement + BBPS' },
  { t: 2, name: 'Tier 2', sub: 'RBI AA live sync (V2)' },
];

function Controls(p: Props) {
  return (
    <div className="space-y-5 text-sm">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Persona</h3>
        <div className="grid gap-2">
          {[
            { id: 'eldo' as const, name: 'Eldo · 3 cards', sub: 'Millennia, Amazon Pay, My Zone. ₹40K MMT cap, ₹50K lounge rule' },
            { id: 'nivin' as const, name: 'Nivin · 5 cards', sub: 'SBI Cashback at ₹4,300 of ₹5,000 cap, Regalia milestone' },
          ].map((x) => (
            <button key={x.id} onClick={() => p.onPersona(x.id)}
              className={`text-left rounded-xl border px-3 py-2 ${p.personaId === x.id ? 'border-navy bg-cyan-tint' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <div className="font-semibold text-navy">{x.name}</div>
              <div className="text-xs text-gray-600">{x.sub}</div>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Consent tier</h3>
        <div className="grid grid-cols-3 gap-2">
          {TIERS.map((x) => (
            <button key={x.t} onClick={() => p.onTier(x.t)}
              className={`rounded-xl border px-2 py-2 text-center ${p.tier === x.t ? 'border-navy bg-navy text-white' : 'border-gray-200 bg-white text-navy hover:border-gray-300'}`}>
              <div className="font-semibold">{x.name}</div>
              <div className={`text-[10px] leading-tight ${p.tier === x.t ? 'text-white/80' : 'text-gray-500'}`}>{x.sub}</div>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">30-second script</h3>
        <ol className="space-y-1.5 text-gray-700 list-decimal pl-4">
          <li>Eldo, Tier 0: tap <b>₹40,000 flights on MakeMyTrip</b>. Millennia caps at ₹20,000.</li>
          <li>Rewards tab: <b>Use sample statement PDF</b>. Watch redaction, then fee-waiver and lounge bars.</li>
          <li>Nivin, Tier 1: tap <b>₹18,000 electronics at Croma</b>. SBI has only ₹700 cap left.</li>
          <li>Consent tab: <b>Erase all my data</b>. Back to Tier 0.</li>
        </ol>
      </section>
      <button onClick={p.onReset} className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 font-medium text-gray-700 hover:bg-gray-50">
        <RotateCcw size={15} /> Reset demo
      </button>
      <p className="text-[11px] text-gray-500 leading-snug">
        Campus case-study prototype by Eashani Das. Not a Paytm product. All cards, caps and spends are sample data simplified from public issuer pages.
      </p>
    </div>
  );
}

export default function PhoneShell(p: Props) {
  const [open, setOpen] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const on = () => setMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); }, [p.scrollKey]);

  const app = (
    <div className="relative flex h-full flex-col overflow-hidden bg-canvas text-gray-900">
      <header className="bg-navy text-white px-4 pt-3 md:pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-white/70">Paytm · Credit Card Bill Pay</div>
            <h1 className="text-lg font-semibold leading-tight">Card Optimizer</h1>
          </div>
          <span className="rounded-full bg-cyan px-2.5 py-1 text-[11px] font-semibold text-navy">Tier {p.tier}</span>
        </div>
      </header>
      <div className="bg-amber-50 text-amber-900 text-[10.5px] px-4 py-1 border-b border-amber-200">
        Case study prototype · not a Paytm product · sample data only
      </div>
      <main ref={mainRef} className="flex-1 overflow-y-auto no-scrollbar">{p.children}</main>
      {p.nav}
      {p.overlay}
    </div>
  );

  return (
    <div className="min-h-full w-full">
      {/* Mobile: full-screen app */}
      <div className="md:hidden h-[100dvh]">
        {mobile && app}
        <button onClick={() => setSheet(true)} aria-label="Open demo controls"
          className="fixed right-3 bottom-20 z-[60] rounded-full bg-white/90 p-2 text-navy shadow"><Presentation size={18} /></button>
        {sheet && (
          <div className="fixed inset-0 z-[70] bg-black/40" onClick={() => setSheet(false)}>
            <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-navy">Interviewer demo controls</h2>
                <button onClick={() => setSheet(false)} aria-label="Close"><X size={18} /></button>
              </div>
              <Controls {...p} />
            </div>
          </div>
        )}
      </div>

      {/* Desktop: phone frame + controls */}
      <div className="hidden md:flex min-h-screen items-center justify-center gap-8 p-6">
        <div className="relative h-[min(880px,calc(100vh-48px))] w-[412px] shrink-0 rounded-[48px] border-[12px] border-gray-900 bg-gray-900 shadow-2xl">
          <div className="absolute left-1/2 top-0 z-[5] h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-gray-900" />
          <div className="h-full overflow-hidden rounded-[36px]">{!mobile && app}</div>
        </div>
        {open ? (
          <aside className="w-[320px] shrink-0 rounded-2xl bg-white/95 p-5 shadow-xl text-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-navy flex items-center gap-2"><Presentation size={18} /> Interviewer demo controls</h2>
              <button onClick={() => setOpen(false)} aria-label="Collapse controls" className="text-gray-500 hover:text-gray-800"><X size={18} /></button>
            </div>
            <Controls {...p} />
          </aside>
        ) : (
          <button onClick={() => setOpen(true)} className="self-start mt-10 inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-sm font-medium text-navy shadow">
            Demo controls <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
