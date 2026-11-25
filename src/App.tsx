import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Gift, Home, ShieldCheck } from 'lucide-react';
import { personaById, type Persona } from './data/personas';
import type { ModalKind, Tab, Tier } from './types';
import PhoneShell from './components/PhoneShell';
import OnboardingModal from './components/OnboardingModal';
import BestCardAI, { type ChatEntry } from './components/BestCardAI';
import SpendDashboard from './components/SpendDashboard';
import CardsHome from './components/CardsHome';
import PrivacyUpgrades from './components/PrivacyUpgrades';

export interface AppState {
  persona: Persona;
  tier: Tier;
  selectedCards: string[];
  upgradeOptIn: boolean;
  salesCallLock: boolean;
  remindersOn: boolean;
  paid: Record<string, string>;
}

const TABS: { id: Tab; label: string; icon: typeof Bot }[] = [
  { id: 'home', label: 'Cards home', icon: Home },
  { id: 'ask', label: 'Ask', icon: Bot },
  { id: 'rewards', label: 'Rewards', icon: Gift },
  { id: 'consent', label: 'Consent', icon: ShieldCheck },
];

export default function App() {
  const [personaId, setPersonaId] = useState<'eldo' | 'nivin'>('eldo');
  const persona = personaById(personaId);
  const [tier, setTier] = useState<Tier>(0);
  const [selectedCards, setSelectedCards] = useState<string[]>(persona.cards);
  const [modal, setModal] = useState<ModalKind>('entry');
  const [tab, setTab] = useState<Tab>('home');
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [upgradeOptIn, setUpgradeOptIn] = useState(false);
  const [salesCallLock, setSalesCallLock] = useState(true);
  const [remindersOn, setRemindersOn] = useState(true);
  const [paid, setPaid] = useState<Record<string, string>>({});
  const [pendingAsk, setPendingAsk] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const switchPersona = (id: 'eldo' | 'nivin') => {
    setPersonaId(id);
    setSelectedCards(personaById(id).cards);
    setChat([]);
    setPaid({});
    setUpgradeOptIn(false);
  };
  const jumpTier = (t: Tier) => {
    setTier(t);
    setModal(null);
    if (t === 0) setUpgradeOptIn(false);
    notify(t === 0 ? 'Tier 0: card names only' : t === 1 ? 'Tier 1: statement linked' : 'Tier 2: live AA sync on');
  };
  const resetAll = () => {
    setTier(0); setSelectedCards(persona.cards); setChat([]); setPaid({}); setUpgradeOptIn(false);
    setSalesCallLock(true); setTab('home'); setModal('entry');
  };
  const eraseAll = () => {
    setTier(0); setChat([]); setPaid({}); setUpgradeOptIn(false); setTab('home');
    notify('All parsed data erased. You are back at Tier 0.');
  };

  const cardIds = tier === 0 ? selectedCards : persona.cards;
  const state: AppState = { persona, tier, selectedCards: cardIds, upgradeOptIn, salesCallLock, remindersOn, paid };

  const ask = (q: string) => { setPendingAsk(q); setTab('ask'); };
  const screen = {
    home: <CardsHome state={state} onAsk={ask} onUnlock={() => setModal('pdf')} onTab={setTab}
      onPaid={(id, ref) => { setPaid((p) => ({ ...p, [id]: ref })); notify('Paid via Paytm UPI. Bank credit in 24-48 hrs.'); }} />,
    ask: <BestCardAI state={state} chat={chat} setChat={setChat} pending={pendingAsk} clearPending={() => setPendingAsk(null)} onUnlock={() => setModal('pdf')} notify={notify} onPayBill={() => setTab('home')} />,
    rewards: <SpendDashboard state={state} onUnlock={() => setModal('pdf')} onLive={() => setModal('aa')} notify={notify} />,
    consent: (
      <PrivacyUpgrades
        state={state}
        onErase={eraseAll}
        onUnlock={() => setModal('pdf')}
        onLive={() => setModal('aa')}
        onEditCards={() => setModal('tier0')}
        onRevoke={(t) => {
          if (t === 2) { setTier(1); notify('Account Aggregator consent revoked. Live sync stopped.'); }
          else { setTier(0); setUpgradeOptIn(false); notify('Statement data deleted. You are on Tier 0.'); }
        }}
        setRemindersOn={(v) => { setRemindersOn(v); notify(v ? 'Reminders on (max 3 a week)' : 'All reminders off'); }}
        setUpgradeOptIn={setUpgradeOptIn}
        setSalesCallLock={(v) => { setSalesCallLock(v); notify(v ? 'Zero Sales-Call lock on' : 'Lock off: still no calls without a fresh opt-in'); }}
      />
    ),
  }[tab];

  return (
    <PhoneShell
      personaId={personaId}
      tier={tier}
      onPersona={switchPersona}
      onTier={jumpTier}
      onReset={resetAll}
      scrollKey={tab}
      overlay={
        <>
          <OnboardingModal
            kind={modal}
            persona={persona}
            selected={selectedCards}
            setSelected={setSelectedCards}
            onClose={() => setModal(null)}
            onEntry={() => setModal('tier0')}
            onTier0Done={() => { setModal(null); notify('Best Card AI and Perk Decoder unlocked'); }}
            onPdfDone={() => { setTier((t) => (t < 1 ? 1 : t)); setModal(null); setTab('rewards'); notify('Statement parsed and deleted. Spend tracker unlocked.'); }}
            onAaDone={(offers) => { setTier(2); setModal(null); if (offers) setUpgradeOptIn(true); notify('Live cap sync on via RBI Account Aggregator'); }}
          />
          {toast && (
            <div role="status" className="absolute inset-x-4 top-24 z-50 mx-auto max-w-[600px] fade-up rounded-xl bg-navy text-white text-sm px-4 py-3 shadow-lg">
              {toast}
            </div>
          )}
        </>
      }
      nav={
        <nav className="grid grid-cols-4 border-t border-gray-200 bg-white" aria-label="Main">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${tab === id ? 'text-navy' : 'text-gray-500'}`}
            >
              <span className={`rounded-full px-3 py-1 ${tab === id ? 'bg-cyan-tint' : ''}`}><Icon size={18} /></span>
              {label}
            </button>
          ))}
        </nav>
      }
    >
      {screen}
    </PhoneShell>
  );
}
