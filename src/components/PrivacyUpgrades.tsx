import { useMemo, useState } from 'react';
import { BellRing, Check, Lock, Minus, PhoneOff, Scale, Trash2 } from 'lucide-react';
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
  onRevoke: (tier: 1 | 2) => void;
  setRemindersOn: (v: boolean) => void;
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

export default function PrivacyUpgrades({ state, onErase, onUnlock, onLive, onEditCards, onRevoke, setRemindersOn, setUpgradeOptIn, setSalesCallLock }: Props) {
  const [confirm, setConfirm] = useState(false);
  const p = state.persona;
  const options = useMemo(() => upgradeOptions(p.cards, p.monthly), [p]);
  const shown = options.filter((o) => o.netAnnual > MIN_ANNUAL_SAVING).slice(0, 2);
  const spend6m = p.monthly.reduce((s, t) => s + t.amount, 0) * 6;

  const tiers = [
    { n: 0, title: 'Your cards', on: true, detail: 'Card name and last 4 digits, on this phone', action: <button onClick={onEditCards} className="text-xs font-semibold text-navy">Edit</button> },
    { n: 1, title: 'November statement', on: state.tier >= 1, detail: state.tier >= 1 ? 'Only where you spent and how much. The PDF is deleted.' : 'Not shared', action: state.tier < 1 ? <button onClick={onUnlock} className="text-xs font-semibold text-navy">Add</button> : <button onClick={() => onRevoke(1)} className="text-xs font-semibold text-alert">Delete</button> },
    { n: 2, title: 'Auto-sync with your banks', on: state.tier >= 2, detail: state.tier >= 2 ? 'On till 1 Mar 2027 · ref AA-PAYTM-2026-8841' : 'Not shared', action: state.tier < 2 ? <button onClick={onLive} className="text-xs font-semibold text-navy">Enable</button> : <button onClick={() => onRevoke(2)} className="text-xs font-semibold text-alert">Revoke</button> },
  ];

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-navy">Your data</h2>
        <p className="text-xs text-gray-500">Everything here is optional. You can stop sharing or delete it any time.</p>
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
        <BellRing size={20} className="text-navy" />
        <div className="flex-1">
          <div className="text-sm font-semibold">Reminders</div>
          <div className="text-xs text-gray-500">Expiring rewards, spend goals and bill due dates. Never more than 3 a week.</div>
        </div>
        <Toggle on={state.remindersOn} onChange={setRemindersOn} label="Reminders" />
      </section>

      <section className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <PhoneOff size={20} className="text-navy" />
        <div className="flex-1">
          <div className="text-sm font-semibold">No sales calls, ever</div>
          <div className="text-xs text-gray-500">We never share your details with banks or agents to call you.</div>
        </div>
        <Toggle on={state.salesCallLock} onChange={setSalesCallLock} label="No sales calls" />
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Scale size={20} className="mt-0.5 text-navy" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">Analyse my spends for better cards</div>
              <Toggle on={state.upgradeOptIn} onChange={setUpgradeOptIn} label="Analyse my spends for better cards" />
            </div>
            <div className="text-xs text-gray-500">Coming soon. Off unless you turn it on, and separate from everything else.</div>
          </div>
        </div>
        {state.upgradeOptIn && (
          state.tier === 0 ? (
            <button onClick={onUnlock} className="mt-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-gray-300 p-3 text-left text-xs text-gray-600">
              <Lock size={14} className="text-navy" /> Needs your spends. Upload 1 statement first.
            </button>
          ) : (
            <div className="mt-3 space-y-2 fade-up">
              <div className="inline-flex rounded-full bg-cyan-tint px-2.5 py-1 text-[11px] font-semibold text-navy">Ranked only by the money you'd save</div>
              {shown.length === 0 ? (
                <p className="text-sm text-gray-700">No card would save you more than {inr(MIN_ANNUAL_SAVING)} a year over the cards you hold, so we are not suggesting one.</p>
              ) : (
                <>
                  <p className="text-sm text-gray-700">
                    Replaying your last 6 months of spends ({inr(spend6m)}) through every card, adding{' '}
                    {shown.map((o, i) => <span key={o.card.id}>{i > 0 && ' or '}<b>{o.card.name}</b></span>)}{' '}
                    would have earned <b>{inr(shown[0].netSixMonth)} extra</b>, after paying its annual fee.
                  </p>
                  {shown.map((o) => (
                    <div key={o.card.id} className="rounded-xl border border-gray-100 p-3 text-xs">
                      <div className="flex justify-between text-sm font-semibold"><span>{o.card.name}</span><span className="tnum text-ok">+{inr(o.netAnnual)} / yr</span></div>
                      <div className="tnum mt-1 text-gray-600">6 months: {inr(o.withCardSixMonth)} with it − {inr(o.currentSixMonth)} today − {inr(o.card.annualFee / 2)} annual fee for 6 months = {inr(o.netSixMonth)}</div>
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
        <p className="text-xs text-gray-500">Deletes your spends, stops auto-sync and starts you fresh with just your card names.</p>
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
