/**
 * Progresso do modo convidado (Mundo 0 sem conta), guardado em localStorage.
 * Ao criar a conta, os ids são enviados para POST /guest/graduate e limpos.
 */
const KEY = 'pp.guest.done';

export function guestDone(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function markGuestDone(stageId: string): void {
  const s = new Set(guestDone());
  s.add(stageId);
  localStorage.setItem(KEY, JSON.stringify([...s]));
}

export function clearGuestProgress(): void {
  localStorage.removeItem(KEY);
}
