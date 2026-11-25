import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Ban, ChevronDown, Flag, Plane, Send, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { RULES_VERIFIED } from '../data/cardRules';
import { inr, parseQuery, pctStr, recommend, type Outcome, type Ranked } from '../engine/optimizer';
import type { AppState } from '../App';

export interface ChatEntry { id: number; q: string; outcome: Outcome; secs: number; tier: number }

const CHIPS = [
  '₹40,000 flights on MakeMyTrip',
  '₹18,000 electronics at Croma',
  '₹12,000 flights on Paytm Travel',
  '₹4,500 dining on Swiggy Dineout',
  '₹25,000 rent payment',
];

interface Props {
  state: AppState;
  chat: ChatEntry[];
  setChat: React.Dispatch<React.SetStateAction<ChatEntry[]>>;
  pending: string | null;
  clearPending: () => void;
  onUnlock: () => void;
  notify: (m: string) => void;
  onPayBill: () => void;
}

function capNotes(r: Ranked[], live: boolean) {
  const notes: string[] = [];
  for (const x of r.slice(0, 3)) {
    for (const c of x.calc.caps) {
      if (c.hitAt === undefined) continue;
      if (c.usedBefore > 0) {
        notes.push(`${x.card.name} has only ${inr(c.cap - c.usedBefore)} left in its ${inr(c.cap)} ${c.label} this cycle (${pctStr(x.effective)} effective on this spend).`);
      } else {
        notes.push(`${x.card.name} hits its ${inr(c.cap)} ${c.label} at ${inr(c.hitAt)}, so the effective return drops to ${pctStr(x.effective)}.`);
      }
    }
  }
  const w = r[0];
  if (live && w?.calc.milestone) notes.push(`${w.card.name}: ${w.calc.formula[w.calc.formula.length - 1].replace(/^Crosses/, 'this spend crosses')}.`);
  return notes;
}

function Answer({ e, onUnlock, notify, bill, onPayBill }: { e: ChatEntry; onUnlock: () => void; notify: (m: string) => void; bill?: { dueDay: number; amount: number }; onPayBill: () => void }) {
  const [open, setOpen] = useState(false);
  const o = e.outcome;
  const footer = (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-ok"><ShieldCheck size={12} /> Rule checked: {RULES_VERIFIED} (MITC)</span>
      <button onClick={() => notify('Verify: open the issuer MITC page for this rule (link in production build).')} className="rounded-full border border-gray-200 px-2 py-0.5 text-gray-600">Verify</button>
      <button onClick={() => notify('Thanks. Ops checks reported rules within 48 hours.')} className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-gray-600"><Flag size={11} /> Report error</button>
    </div>
  );

  if (o.kind === 'need_amount') {
    return <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">Tell me the amount and where, for example <b>₹5,000 at Amazon</b>.</div>;
  }
  if (o.kind === 'excluded') {
    return (
      <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
        <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-alert">
          <Ban size={18} className="shrink-0 mt-0.5" />
          <div><b>None of your cards earn rewards on {o.merchant.name.toLowerCase()}</b> (MCC {o.merchant.mcc} is excluded). Pay the way that has the lowest fee instead.</div>
        </div>
        <ul className="mt-3 space-y-1 text-xs text-gray-600">
          {o.ranked.map((x) => <li key={x.card.id}>• {x.calc.formula[0]}</li>)}
        </ul>
        <p className="mt-2 text-xs text-gray-500">Card rent payments usually also carry a 1-2% platform fee, so they cost more than they earn.</p>
        {footer}
      </div>
    );
  }
  if (o.kind === 'unverified') {
    return (
      <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-amber-900">
          <AlertTriangle size={18} className="shrink-0 mt-0.5 text-warn" />
          <div>Merchant category (MCC) unverified for <b>{o.label}</b>. Showing the top 2 safe cards on their base rate rather than guessing.</div>
        </div>
        <ol className="mt-3 space-y-2">
          {o.ranked.map((x, i) => (
            <li key={x.card.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
              <span><b>{i + 1}.</b> {x.card.name} <span className="text-xs text-gray-500">· {x.card.baseLabel}</span></span>
              <span className="tnum font-semibold">{inr(x.calc.value)}</span>
            </li>
          ))}
        </ol>
        {footer}
      </div>
    );
  }

  const [win, second] = o.ranked;
  const notes = capNotes(o.ranked, o.liveCaps);
  const travel = ['flights', 'hotels', 'movies'].includes(o.merchant.category) && !o.merchant.paytm;
  return (
    <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
      <div className="rounded-xl bg-cyan-tint p-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold uppercase tracking-wide text-navy">Best card</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 font-medium text-navy"><Zap size={11} className="text-cyan" /> {e.secs.toFixed(1)}s • Deterministic Rules Engine</span>
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <div className="text-base font-semibold text-navy">{win.card.name}</div>
            <div className="text-xs text-gray-600">{o.merchant.name} · {inr(o.amount)}</div>
          </div>
          <div className="text-right">
            <div className="tnum text-2xl font-bold text-navy">{inr(win.calc.value)}</div>
            <div className="tnum text-xs font-semibold text-ok">{pctStr(win.effective)} back</div>
          </div>
        </div>
      </div>

      {notes.map((n) => (
        <div key={n} className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-900">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" /> {n}
        </div>
      ))}
      {!o.liveCaps && (
        <button onClick={onUnlock} className="mt-2 w-full rounded-xl border border-dashed border-gray-300 p-2.5 text-left text-xs text-gray-600">
          Tier 0 assumes this month's caps are unused. <span className="font-semibold text-navy">Upload 1 statement to make this cap-aware →</span>
        </button>
      )}

      {second && (
        <div className="mt-3 rounded-xl border border-gray-100 p-3">
          <div className="text-xs font-semibold text-gray-500">Why not #2?</div>
          <div className="mt-1 flex justify-between"><span>{second.card.name}</span><span className="tnum">{inr(second.calc.value)} · {pctStr(second.effective)}</span></div>
          <div className="mt-1 text-xs text-alert">You would lose {inr(win.calc.value - second.calc.value)} by swiping it.</div>
          {o.ranked.slice(2).map((x) => (
            <div key={x.card.id} className="mt-1 flex justify-between text-xs text-gray-500"><span>{x.card.name}</span><span className="tnum">{x.calc.excluded ? 'excluded' : inr(x.calc.value)}</span></div>
          ))}
        </div>
      )}

      <button onClick={() => setOpen(!open)} aria-expanded={open} className="mt-3 flex w-full items-center justify-between text-xs font-semibold text-navy">
        Calculation proof and MITC source <ChevronDown size={15} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 rounded-xl bg-canvas p-3 text-xs text-gray-700">
          <div><b>Detected:</b> {o.merchant.name} · MCC {o.merchant.mcc} · {o.merchant.category.replace('_', ' ')} · {o.merchant.channel}</div>
          {win.calc.formula.map((f) => <div key={f}>• {f}</div>)}
          {win.calc.caps.map((c) => (
            <div key={c.label}><b>Cap:</b> {inr(c.usedBefore)} used before → {inr(c.usedAfter)} after, of {inr(c.cap)} ({c.label})</div>
          ))}
          <div><b>Card state used:</b> {o.liveCaps ? 'linked statement (caps and milestones live)' : 'none, Tier 0 (caps assumed unused)'}</div>
          <div className="text-gray-500">Every ₹ is computed by the rules engine. In production an LLM only phrases this explanation.</div>
        </div>
      )}

      {bill && (
        <button onClick={onPayBill} className="mt-3 flex w-full items-center justify-between rounded-xl bg-canvas px-3 py-2 text-xs text-gray-700">
          <span>Then pay the {win.card.name} bill on Paytm · due {bill.dueDay} Dec</span><span className="font-semibold text-navy">Pay →</span>
        </button>
      )}
      {travel && (
        <button onClick={() => notify('Opens Paytm Travel with this search (prototype).')} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan bg-white py-2 text-xs font-semibold text-navy">
          <Plane size={14} /> Book via Paytm Travel to earn extra instant discount →
        </button>
      )}
      {footer}
    </div>
  );
}

export default function BestCardAI({ state, chat, setChat, pending, clearPending, onUnlock, notify, onPayBill }: Props) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const ask = (q: string) => {
    if (!q.trim() || busy) return;
    setText('');
    setBusy(true);
    const t0 = performance.now();
    const outcome = recommend(parseQuery(q), state.selectedCards, state.tier > 0 ? state.persona.state : null);
    timer.current = window.setTimeout(() => {
      setChat((c) => [...c, { id: Date.now(), q, outcome, secs: (performance.now() - t0) / 1000, tier: state.tier }]);
      setBusy(false);
    }, 1050);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => { if (pending) { ask(pending); clearPending(); } }); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [chat.length, busy]);

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-4 p-4">
        {chat.length === 0 && !busy && (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-navy"><Sparkles size={18} className="text-cyan" /> Which card for this?</div>
            <p className="mt-1 text-sm text-gray-600">Type an amount and a merchant. I rank your {state.selectedCards.length} cards by the rupees you actually get back after caps and exclusions.</p>
          </div>
        )}
        {chat.map((e) => (
          <div key={e.id} className="space-y-2 fade-up">
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-navy px-3 py-2 text-sm text-white">{e.q}</div>
            <Answer e={e} onUnlock={onUnlock} notify={notify} onPayBill={onPayBill}
              bill={e.outcome.kind === 'ranked' ? state.persona.bills.find((b) => e.outcome.kind === 'ranked' && b.cardId === e.outcome.ranked[0].card.id) : undefined} />
          </div>
        ))}
        {busy && <div className="w-fit rounded-2xl bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">Checking caps and rules…</div>}
        <div ref={end} />
      </div>
      <div className="sticky bottom-0 border-t border-gray-200 bg-canvas/95 px-3 pb-3 pt-2 backdrop-blur">
        <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-2">
          {CHIPS.map((c) => (
            <button key={c} onClick={() => ask(c)} className="shrink-0 rounded-full border border-cyan/50 bg-white px-3 py-1.5 text-xs font-medium text-navy">{c}</button>
          ))}
        </div>
        <form onSubmit={(ev) => { ev.preventDefault(); ask(text); }} className="flex gap-2">
          <input value={text} onChange={(ev) => setText(ev.target.value)} placeholder="e.g. ₹8,000 at Local Shop"
            className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-navy" aria-label="Ask which card to use" />
          <button className="rounded-xl bg-navy px-3 text-white disabled:opacity-40" disabled={busy || !text.trim()} aria-label="Ask"><Send size={18} /></button>
        </form>
      </div>
    </div>
  );
}
