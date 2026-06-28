/** Controla se o tour de introdução já foi visto (só aparece na 1ª vez). */
const KEY = 'pp.seenIntro';
export const hasSeenIntro = (): boolean => localStorage.getItem(KEY) === '1';
export const markIntroSeen = (): void => localStorage.setItem(KEY, '1');
