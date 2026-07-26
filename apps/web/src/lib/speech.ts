/**
 * Anuncia uma conquista sob demanda. Mantemos isso separado dos efeitos sonoros:
 * a pessoa pode ouvir o nome da badge mesmo tendo desativado a trilha de sons.
 */
export function speakLabel(label: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(label);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Navegador/OS sem síntese disponível: o rótulo visível continua acessível.
  }
}
