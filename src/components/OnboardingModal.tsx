import { useEffect, useState } from 'react';
import { Check, CreditCard, FileText, Loader2, Lock, ShieldCheck, Sparkles, X } from 'lucide-react';
import { CARDS } from '../data/cardRules';
import type { Persona } from '../data/personas';
import { maskOf, type ModalKind } from '../types';

interface Props {
  kind: ModalKind;
  persona: Persona;
  selected: string[];
  setSelected: (ids: string[]) => void;
  onClose: () => void;
  onEntry: () => void;
  onTier0Done: () => void;
  onPdfDone: () => void;
  onAaDone: (offers: boolean) => void;
}

const REDACTION = [
  'Removing your full card number and personal details...',
  'Keeping only the last 4 digits, shop names and amounts...',
  'Deleting the PDF from our system',
];

function Sheet({ title, onClose, children }: { title: string; onClose?: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-black/45" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fade-up mx-auto max-h-[92%] w-full max-w-[640px] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom, 0px))' }}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-navy leading-snug">{title}</h2>
          {onClose && <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700"><X size={20} /></button>}
        </div>
        {children}
      </div>
    </div>
  );
}

function PdfFlow({ persona, onDone, onClose }: { persona: Persona; onDone: () => void; onClose: () => void }) {
  const [step, setStep] = useState(-1); // -1 = pick file, 0..3 = redaction progress
  useEffect(() => {
    if (step < 0 || step > REDACTION.length) return;
    if (step === REDACTION.length) { const t = window.setTimeout(onDone, 450); return () => window.clearTimeout(t); }
    const t = window.setTimeout(() => setStep((s) => s + 1), 500);
    return () => window.clearTimeout(t);
  }, [step, onDone]);

  return (
    <Sheet title="See your spends and rewards" onClose={step < 0 ? onClose : undefined}>
      {step < 0 ? (
        <>
          <p className="text-sm text-gray-600">Upload one password-protected statement PDF. We read it on your phone, delete the PDF, and keep only the last 4 digits of your card, where you spent and how much.</p>
          <div className="mt-4 rounded-2xl border-2 border-dashed border-gray-300 p-5 text-center">
            <FileText className="mx-auto text-gray-400" size={30} />
            <div className="mt-2 text-sm font-medium text-gray-700">Choose a statement PDF</div>
            <div className="text-xs text-gray-500">Real upload is disabled in this prototype</div>
          </div>
          <button onClick={() => setStep(0)} className="mt-4 w-full rounded-xl bg-navy py-3 font-semibold text-white">
            Use sample statement PDF
          </button>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500"><Lock size={13} /> We never read your email or SMS. Delete any time.</p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-xl bg-canvas p-3 text-sm">
            <FileText size={22} className="text-navy" />
            <div>
              <div className="font-medium">{persona.name}_statement_Nov2026.pdf</div>
              <div className="text-xs text-gray-500">Removing personal details on your phone</div>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {REDACTION.map((line, i) => (
              <li key={line} className={`flex items-center gap-2 text-sm ${i <= step ? 'text-gray-900' : 'text-gray-400'}`}>
                {i < step ? <Check size={17} className="text-ok" /> : i === step ? <Loader2 size={17} className="animate-spin text-cyan" /> : <span className="h-[17px] w-[17px] rounded-full border border-gray-300" />}
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full bg-cyan transition-all duration-500" style={{ width: `${(Math.min(step, 3) / 3) * 100}%` }} />
          </div>
        </>
      )}
    </Sheet>
  );
}

function AaFlow({ persona, onDone, onClose }: { persona: Persona; onDone: (offers: boolean) => void; onClose: () => void }) {
  const [offers, setOffers] = useState(false);
  const fips = Array.from(new Set(persona.cards.map((id) => CARDS.find((c) => c.id === id)!.issuer))).join(', ');
  const rows: [string, string][] = [
    ['Reference', 'AA-PAYTM-2026-8841'],
    ['Used for', 'Tracking spends and reward limits only'],
    ['What we see', 'Your card transactions and statement totals'],
    ['From', fips],
    ['How often', 'Once a day'],
    ['Valid for', '90 days (till 1 Mar 2027)'],
    ['Your data', 'Deleted when this ends or you stop it'],
  ];
  return (
    <Sheet title="Turn on auto-sync with your banks" onClose={onClose}>
      <p className="text-xs text-gray-500 -mt-1 mb-3">Uses India's RBI-approved Account Aggregator system. You can stop it any time. (Demo of a future feature.)</p>
      <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-3 py-2">
            <dt className="text-gray-500 shrink-0">{k}</dt>
            <dd className="text-right font-medium text-gray-900">{v}</dd>
          </div>
        ))}
      </dl>
      <label className="mt-4 flex items-start gap-3 rounded-xl border border-gray-200 p-3 text-sm">
        <input type="checkbox" checked={offers} onChange={(e) => setOffers(e.target.checked)} className="mt-0.5 h-4 w-4 accent-navy" />
        <span>
          <span className="font-medium">Show data-backed card upgrade offers</span>
          <span className="block text-xs text-gray-500">Optional and off unless you tick it. Saying no changes nothing else.</span>
        </span>
      </label>
      <button onClick={() => onDone(offers)} className="mt-4 w-full rounded-xl bg-navy py-3 font-semibold text-white">Allow auto-sync</button>
      <button onClick={onClose} className="mt-2 w-full rounded-xl py-2.5 text-sm font-medium text-gray-600">Not now</button>
    </Sheet>
  );
}

export default function OnboardingModal(p: Props) {
  if (p.kind === 'pdf') return <PdfFlow persona={p.persona} onDone={p.onPdfDone} onClose={p.onClose} />;
  if (p.kind === 'aa') return <AaFlow persona={p.persona} onDone={p.onAaDone} onClose={p.onClose} />;
  if (p.kind === 'entry') {
    const bill = p.persona.bills[0];
    const card = CARDS.find((c) => c.id === bill.cardId)!;
    return (
      <div className="absolute inset-0 z-40 flex flex-col bg-canvas" role="dialog" aria-modal="true" aria-label="Credit card bill pay">
        <div className="bg-navy px-5 pb-6 text-white" style={{ paddingTop: 'max(32px, calc(env(safe-area-inset-top, 0px) + 16px))' }}>
          <div className="mx-auto max-w-[640px]">
          <div className="text-xs text-white/70">Paytm · Recharge & Bills</div>
          <h2 className="text-xl font-semibold">Credit Card Bill Payment</h2>
          </div>
        </div>
        <div className="-mt-4 mx-auto w-full max-w-[640px] space-y-3 overflow-y-auto px-4 pb-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-xl p-2 text-white" style={{ background: card.color }}><CreditCard size={20} /></span>
              <div className="flex-1">
                <div className="text-sm font-semibold">{card.name} {maskOf(card.id)}</div>
                <div className="text-xs text-gray-500">Due on the {bill.dueDay}th</div>
              </div>
              <div className="tnum text-right font-semibold">₹{bill.amount.toLocaleString('en-IN')}</div>
            </div>
            <button className="mt-3 w-full rounded-xl border border-navy py-2 text-sm font-semibold text-navy" onClick={p.onEntry}>
              Pay {card.issuer.split(' ')[0]} card ₹{bill.amount.toLocaleString('en-IN')}
            </button>
          </div>
          <div className="rounded-2xl border border-cyan/40 bg-cyan-tint p-4">
            <div className="flex items-center gap-2 font-semibold text-navy"><Sparkles size={18} /> Your cards could earn more</div>
            <p className="mt-1 text-sm text-gray-700">See which card to use where, and catch rewards before they expire. Free.</p>
            <button onClick={p.onEntry} className="mt-3 w-full rounded-xl bg-navy py-3 font-semibold text-white">Check my cards</button>
            <p className="mt-2 text-center text-xs text-gray-600">No sales calls · No inbox access</p>
          </div>
          <p className="px-2 text-center text-[11px] text-gray-500">Case study prototype · not a Paytm product · sample data only</p>
        </div>
      </div>
    );
  }
  if (p.kind !== 'tier0') return null;

  return <CardPicker {...p} />;
}

function CardPicker(p: Props) {
  const [q, setQ] = useState('');
  const [requested, setRequested] = useState(false);
  const list = CARDS.filter((c) => (c.name + ' ' + c.issuer).toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (id: string) => p.setSelected(p.selected.includes(id) ? p.selected.filter((x) => x !== id) : [...p.selected, id]);
  return (
    <Sheet title="Which credit cards do you have?">
      <p className="text-sm text-gray-600">Tap the cards you hold. That is all we need to tell you which card to swipe.</p>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cyan-tint px-3 py-1.5 text-xs font-semibold text-navy">
        <ShieldCheck size={14} /> We never read your email or SMS · No sales calls
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your card, e.g. Millennia" aria-label="Search cards"
        className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-navy" />
      <div className="mt-3 flex flex-wrap gap-2">
        {list.map((c) => {
          const on = p.selected.includes(c.id);
          return (
            <button key={c.id} onClick={() => toggle(c.id)} aria-pressed={on}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${on ? 'border-navy bg-navy text-white' : 'border-gray-300 bg-white text-gray-700'}`}>
              {on && <Check size={14} />}{c.name}{on && <span className="text-white/70 text-xs">{maskOf(c.id)}</span>}
            </button>
          );
        })}
      </div>
      {list.length === 0 && (
        <div className="mt-1 rounded-xl bg-canvas p-3 text-sm text-gray-600">
          Card not in our list yet.{' '}
          {requested ? <span className="font-semibold text-ok">Thanks! We'll add it once we've checked its terms.</span>
            : <button onClick={() => setRequested(true)} className="font-semibold text-navy">Request it</button>}
        </div>
      )}
      <button disabled={!p.selected.length} onClick={p.onTier0Done}
        className="mt-5 w-full rounded-xl bg-navy py-3 font-semibold text-white disabled:opacity-40">
        Continue with {p.selected.length} card{p.selected.length === 1 ? '' : 's'}
      </button>
      <p className="mt-2 text-center text-xs text-gray-500">We store card name + last 4 only. No login, no bank link.</p>
    </Sheet>
  );
}
