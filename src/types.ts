export type Tier = 0 | 1 | 2;
export type Tab = 'home' | 'ask' | 'rewards' | 'consent';
export type ModalKind = 'entry' | 'tier0' | 'pdf' | 'aa' | null;
// Fixed demo date so due-date nudges look the same in every interview.
export const DEMO_DAY = 1;
export const LEVEL_NAME = ['Basic', 'Statement added', 'Auto-sync on'] as const;
export const DEMO_DATE_LABEL = '1 Dec 2026';
export const maskOf = (cardId: string) => {
  let h = 0;
  for (const ch of cardId) h = (h * 31 + ch.charCodeAt(0)) % 9000;
  return '•• ' + String(1000 + h);
};
