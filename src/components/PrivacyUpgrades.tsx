import { useMemo, useState } from 'react';
import { Check, Lock, Minus, PhoneOff, Scale, Trash2 } from 'lucide-react';
import { cardById } from '../data/cardRules';
import { inr, upgradeOptions } from '../engine/optimizer';
import { maskOf } from '../types';
import type { AppState } from '../App';

interface Props {
  state: AppState;
  onErase: () => void;
  onUnlock: () => void;
  onLive: () => void;
  onEditCards: () => void;
  setUpgradeOptIn: (v: boolean) => void;
  setSalesCallLock: (v: boolean) => void;
}

const MIN_ANNUAL_SAVING = 3000; // deck rule: suggest a card only if it saves more than ₹3,000 a year

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-navy' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

export default function PrivacyUpgrades({ state, onErase, onUnlock, onLive, onEditCards, setUpgradeOptIn, setSalesCallLock }: Props) {
  const [confirm, setConfirm] = useState(false);
  const p = state.persona;
  const options = useMemo(() => upgradeOptions(p.cards, p.monthly), [p]);
  const shown = options.filter((o) => o.netAnnual > MIN_ANNUAL_SAVING).slice(0, 2);
  const spend6m = p.monthly.reduce((s, t) => s + t.amount, 0) * 6;

  const tiers = [
    { n: 0, title: 'Tier 0 · card names', on: true, detail: 'Card name and last 4 digits, on this phone', action: <button onClick={onEditCards} className="text-xs font-semibold text-navy">Edit</button> },
    { n: 1, title: 'Tier 1 · Nov statement', on: state.tier >= 1, detail: state.tier >= 1 ? 'Merchant category and amount only. PDF deleted after parsing' : 'Not shared', action: state.tier < 1 ? <button onClick={onUnlock} className="text-xs font-semibold text-navy">Add</button> : null },
    { n: 2, title: 'Tier 2 · Account Aggregator', on: state.tier >= 2, detail: state.tier >= 2 ? 'Consent AA-PAYTM-2026-8841 · valid till 1 Mar 2027' : 'Not shared', action: state.tier < 2 ? <button onClick={onLive} className="text-xs font-semibold text-navy">Enable</button> : null },
  ];

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-navy">Your data</h2>
        <p className="text-xs text-gray-500">Consent centre · DPDP Act 2023. Every step is optional and revocable.</p>
        <ul className="mt-3 space-y-3">
          {tiers.map((t) => (
            <li key={t.n} className="flex items-start gap-3">
              <span className={`mt-0.5 rounded-full p-1 ${t.on ? 'bg-emerald-50 text-ok' : 'bg-gray-100 text-gray-400'}`}>{t.on ? <Check size={14} /> : <Minus size={14} />}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{t.title}</div>
                <div className="text-xs text-gray-500">{t.detail}</div>
              </div>
              {t.action}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {state.selectedCards.map((id) => (
            <span key={id} className="rounded-full bg-canvas px-2.5 py-1 text-[11px] text-gray-700">{cardById(id).name} {maskOf(id)}</span>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-gray-500">Never collected: full card number, CVV, Gmail, SMS.</p>
      </section>

      <section className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <PhoneOff size={20} className="text-navy" />
        <div className="flex-1">
          <div className="text-sm font-semibold">Zero Sales-Call Guarantee</div>
          <div className="text-xs text-gray-500">Your data is never passed to banks or agents for calls.</div>
        </div>
        <Toggle on={state.salesCallLock} onChange={setSalesCallLock} label="Zero Sales-Call Guarantee" />
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Scale size={20} className="mt-0.5 text-navy" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Analyse my spends for better cards</div>
              <Toggle on={state.upgradeOptIn} onChange={setUpgradeOptIn} label="Analyse my spends for better cards" />
            </div>
            <div className="text-xs text-gray-500">V2 preview. Off unless you turn it on. Separate from every other consent.</div>
          </div>
        </div>
        {state.upgradeOptIn && (
          state.tier === 0 ? (
            <button onClick={onUnlock} className="mt-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-gray-300 p-3 text-left text-xs text-gray-600">
              <Lock size={14} className="text-navy" /> Needs your spends. Upload 1 statement first.
            </button>
          ) : (
            <div className="mt-3 space-y-2 fade-up">
              <div className="inline-flex rounded-full bg-cyan-tint px-2.5 py-1 text-[11px] font-semibold text-navy">Ranked strictly by net ₹ saved • Zero commission bias</div>
              {shown.length === 0 ? (
                <p className="text-sm text-gray-700">No card would save you more than {inr(MIN_ANNUAL_SAVING)} a year over the cards you hold, so we are not suggesting one.</p>
              ) : (
                <>
                  <p className="text-sm text-gray-700">
                    Replaying your last 6 months of spends ({inr(spend6m)}) through every card, adding{' '}
                    {shown.map((o, i) => <span key={o.card.id}>{i > 0 && ' or '}<b>{o.card.name}</b></span>)}{' '}
                    would have earned <b>{inr(shown[0].netSixMonth)} extra</b> net of annual fee.
                  </p>
                  {shown.map((o) => (
                    <div key={o.card.id} className="rounded-xl border border-gray-100 p-3 text-xs">
                      <div className="flex justify-between text-sm font-semibold"><span>{o.card.name}</span><span className="tnum text-ok">+{inr(o.netAnnual)} / yr</span></div>
                      <div className="tnum mt-1 text-gray-600">6 months: {inr(o.withCardSixMonth)} with it − {inr(o.currentSixMonth)} today − {inr(o.card.annualFee / 2)} half-year fee = {inr(o.netSixMonth)}</div>
                    </div>
                  ))}
                </>
              )}
              <p className="text-[11px] text-gray-500">Shown only when the saving beats {inr(MIN_ANNUAL_SAVING)} a year. If Paytm earns a referral fee on a card, it is disclosed here; it never changes the order.</p>
            </div>
          )
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">Delete my card data</div>
        <p className="text-xs text-gray-500">Clears parsed spends, AA consent and upgrade analysis, and returns you to Tier 0.</p>
        {confirm ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => setConfirm(false)} className="rounded-xl border border-gray-300 py-2.5 text-sm font-medium">Cancel</button>
            <button onClick={() => { setConfirm(false); onErase(); }} className="rounded-xl bg-alert py-2.5 text-sm font-semibold text-white">Yes, erase all</button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-alert py-2.5 text-sm font-semibold text-alert">
            <Trash2 size={16} /> Erase all my data
          </button>
        )}
      </section>
    </div>
  );
}
