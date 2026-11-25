import { useState } from 'react';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Bell, ChevronDown, Copy, Gift, Lock, Plane, Radio, Route, Ticket, Trophy } from 'lucide-react';
import { MERCHANTS, cardById, type Category } from '../data/cardRules';
import { inr } from '../engine/optimizer';
import type { AppState } from '../App';

const GROUP: Record<Category, string> = {
  flights: 'Travel', hotels: 'Travel', cabs: 'Travel', online_shopping: 'Online shopping', electronics: 'Online shopping',
  dining: 'Dining & food', food_delivery: 'Dining & food', groceries: 'Groceries', utilities: 'Bills & utilities', telecom: 'Bills & utilities',
  movies: 'Entertainment', rent: 'Excluded (rent, fuel)', fuel: 'Excluded (rent, fuel)', wallet: 'Excluded (rent, fuel)', unknown: 'Other',
};

const CAPS = [
  { card: 'hdfc_millennia', bucket: 'partner', label: '5% partner cap', cap: 1000 },
  { card: 'hdfc_millennia', bucket: 'other', label: '1% other-spends cap', cap: 1000 },
  { card: 'sbi_cashback', bucket: 'all', label: 'monthly cashback cap', cap: 5000 },
  { card: 'axis_airtel', bucket: 'food', label: 'food and grocery cap', cap: 500 },
  { card: 'axis_airtel', bucket: 'util', label: 'utilities cap', cap: 250 },
];

function RemindBtn({ id, on, set, toggle }: { id: string; on: boolean; set: Set<string>; toggle: (id: string) => void }) {
  const active = on && set.has(id);
  return (
    <button onClick={() => toggle(id)} aria-pressed={active}
      className={`mt-2 mr-2 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${active ? 'border-ok bg-emerald-50 text-ok' : 'border-gray-200 text-gray-600'}`}>
      <Bell size={12} /> {active ? 'Reminder set' : 'Remind me'}
    </button>
  );
}

interface Props { state: AppState; onUnlock: () => void; onLive: () => void; notify: (m: string) => void }

function Progress({ done, target }: { done: number; target: number }) {
  const pct = Math.min(100, (done / target) * 100);
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-cyan" style={{ width: `${pct}%` }} />
    </div>
  );
}

function PerkDecoder({ cards }: { cards: string[] }) {
  const [open, setOpen] = useState<string | null>(cards[0] ?? null);
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-navy">Perk decoder</h2>
      <p className="text-xs text-gray-500">Your card terms in plain English</p>
      <ul className="mt-2 divide-y divide-gray-100">
        {cards.map((id) => {
          const c = cardById(id);
          const on = open === id;
          return (
            <li key={id}>
              <button onClick={() => setOpen(on ? null : id)} aria-expanded={on} className="flex w-full items-center justify-between py-2.5 text-left text-sm font-medium">
                <span className="flex items-center gap-2"><span className="h-3 w-5 rounded-sm" style={{ background: c.color }} />{c.name}</span>
                <span className="flex items-center gap-2 text-xs text-gray-500">{c.annualFee ? `Fee ${inr(c.annualFee)}` : 'Lifetime free'}<ChevronDown size={15} className={on ? 'rotate-180' : ''} /></span>
              </button>
              {on && (
                <ul className="mb-3 space-y-1 pl-7 text-xs text-gray-700">
                  {c.perks.map((p) => <li key={p} className="list-disc">{p}</li>)}
                  {c.lounge && <li className="list-disc">{c.lounge}</li>}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function SpendDashboard({ state, onUnlock, onLive, notify }: Props) {
  const p = state.persona;
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  if (state.tier === 0) {
    return (
      <div className="space-y-4 p-4">
        <section className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
          <div className="pointer-events-none select-none blur-[5px]" aria-hidden>
            <div className="font-semibold">Spends this month ₹62,400</div>
            <div className="mt-3 space-y-2">{[80, 55, 40, 30].map((w) => <div key={w} className="h-4 rounded bg-cyan/60" style={{ width: `${w}%` }} />)}</div>
            <div className="mt-4 h-2 rounded bg-gray-200" /><div className="mt-2 h-2 w-2/3 rounded bg-gray-200" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 p-6 text-center">
            <Lock className="text-navy" />
            <div className="mt-2 font-semibold text-navy">Spend tracker, milestones and voucher vault</div>
            <button onClick={onUnlock} className="mt-3 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white">Upload 1 Encrypted PDF to Unlock (Zero Gmail Access)</button>
          </div>
        </section>
        <PerkDecoder cards={state.selectedCards} />
      </div>
    );
  }

  const totals: Record<string, number> = {};
  for (const t of p.monthly) {
    const g = GROUP[MERCHANTS.find((m) => m.id === t.merchantId)!.category];
    totals[g] = (totals[g] ?? 0) + t.amount;
  }
  const data = Object.entries(totals).map(([name, value]) => ({ name, value })).sort((a, b) => (a.name.startsWith('Excluded') ? 1 : b.name.startsWith('Excluded') ? -1 : b.value - a.value));
  const total = p.monthly.reduce((s, t) => s + t.amount, 0);
  const caps = CAPS.filter((c) => p.cards.includes(c.card));
  const util = p.monthly.find((t) => t.merchantId === 'electricity');

  const toggleRemind = (id: string) => {
    if (!state.remindersOn) { notify('Reminders are off. Turn them on in Consent.'); return; }
    setReminders((r) => { const n = new Set(r); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    notify(reminders.has(id) ? 'Reminder removed' : 'Reminder set: 14 days and 2 days before (max 3 nudges a week)');
  };
  const copy = async (code: string) => {
    try { await navigator.clipboard.writeText(code); notify(`Code ${code} copied`); } catch { notify(`Code: ${code}`); }
  };

  return (
    <div className="space-y-4 p-4">
      <div className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${state.tier === 2 ? 'bg-emerald-50 text-ok' : 'bg-white text-gray-600 shadow-sm'}`}>
        {state.tier === 2 ? <span className="flex items-center gap-1.5"><Radio size={14} /> Live via Account Aggregator · synced 2 min ago</span> : <span>From your Nov statement (PDF deleted after parsing)</span>}
        {state.tier === 1 && <button onClick={onLive} className="font-semibold text-navy">Enable Live Cap Sync (RBI AA)</button>}
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold text-navy">Spends this month</h2>
          <span className="tnum text-lg font-bold">{inr(total)}</span>
        </div>
        <p className="text-xs text-gray-500">Across {p.cards.length} cards, by category</p>
        <div className="mt-2 h-[230px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 56, bottom: 0, left: 0 }} barCategoryGap={6}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={118} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
              <Tooltip cursor={{ fill: '#EBF8FF' }} formatter={(v: number) => [inr(v), 'Spent']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {data.map((d) => <Cell key={d.name} fill={d.name.startsWith('Excluded') ? '#CBD5E1' : '#00BAF2'} />)}
                <LabelList dataKey="value" position="right" formatter={(v: number) => inr(v)} style={{ fontSize: 11, fill: '#0F172A' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-gray-500">Grey: spends that earn no rewards on any of your cards.</p>
      </section>

      {caps.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-navy">Reward caps used this cycle</h2>
          <p className="text-xs text-gray-500">Best Card answers use these, so a full cap is never recommended.</p>
          <div className="mt-2 space-y-3">
            {caps.map((c) => {
              const used = p.state[c.card]?.capUsed[c.bucket] ?? 0;
              return (
                <div key={c.card + c.bucket}>
                  <div className="flex justify-between text-sm"><span>{cardById(c.card).name} · {c.label}</span><span className="tnum text-xs text-gray-600">{inr(used)} / {inr(c.cap)}</span></div>
                  <Progress done={used} target={c.cap} />
                  <div className="mt-0.5 text-[11px] text-gray-500">{inr(c.cap - used)} of cashback left</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-navy">Milestones and fee waivers</h2>
        <div className="mt-2 space-y-4">
          {p.milestones.map((m) => {
            const left = m.target - m.done;
            const Icon = m.kind === 'lounge' ? Plane : m.kind === 'fee' ? Trophy : Gift;
            return (
              <div key={m.label}>
                <div className="flex items-start justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 font-medium"><Icon size={16} className="text-navy" />{cardById(m.cardId).name}: {m.label}</span>
                </div>
                <div className="tnum mt-0.5 text-xs text-gray-500">{inr(m.done)} / {inr(m.target)}</div>
                <Progress done={m.done} target={m.target} />
                <div className="mt-1 text-xs font-semibold text-navy">Spend {inr(left)} more {m.deadline} to {m.reward}.</div>
                {m.kind === 'fee' && util && (
                  <button onClick={() => notify(`Opens Paytm electricity bill pay with ${cardById(m.cardId).name} selected (prototype).`)}
                    className="mt-1.5 flex w-full items-start gap-1.5 rounded-lg bg-navy px-2.5 py-2 text-left text-[11px] font-semibold text-white">
                    <Route size={13} className="mt-0.5 shrink-0" /> Pay {inr(util.amount)} electricity bill with {cardById(m.cardId).name}: closes {Math.min(100, Math.round((util.amount / left) * 100))}% of the gap
                  </button>
                )}
                <RemindBtn id={m.label} on={state.remindersOn} set={reminders} toggle={toggleRemind} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-navy">Expiry vault</h2>
        <p className="text-xs text-gray-500">Points and vouchers you could lose. Nudges at most 3 a week.</p>
        <ul className="mt-2 space-y-2">
          {p.vouchers.map((v) => (
            <li key={v.title} className="rounded-xl border border-gray-100 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 text-sm">
                  <Ticket size={16} className="mt-0.5 text-navy" />
                  <div>
                    <div className="font-medium">{v.title}</div>
                    <div className="text-xs text-gray-500">{cardById(v.cardId).name} · worth {inr(v.value)}{v.note ? ` · ${v.note}` : ''}</div>
                  </div>
                </div>
                {v.expiresInDays !== undefined ? (
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${v.expiresInDays <= 14 ? 'bg-red-50 text-alert' : 'bg-amber-50 text-warn'}`}>Expires in {v.expiresInDays} days</span>
                ) : <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">Unused</span>}
              </div>
              <RemindBtn id={v.title} on={state.remindersOn} set={reminders} toggle={toggleRemind} />
              {v.code && (
                <button onClick={() => copy(v.code!)} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-navy">
                  <Copy size={12} /> Copy code {v.code}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <PerkDecoder cards={p.cards} />
    </div>
  );
}
