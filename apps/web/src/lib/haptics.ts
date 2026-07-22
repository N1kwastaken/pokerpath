/**
 * Vibração curta nos momentos de feedback (Android; o iOS Safari não expõe a
 * API e ignora em silêncio). É o "toque" físico do jogo — e funciona mesmo
 * com o som mudo, que é justamente quando ele mais faz falta.
 *
 * Padrões em ms, calibrados curtos: háptica boa se SENTE, não se percebe.
 */
import { a11y } from './a11y.js';

function buzz(pattern: number | number[]) {
  try {
    if (!a11y.haptics()) return; // desligável nas configurações
    navigator.vibrate?.(pattern);
  } catch {
    /* nunca derruba o jogo por causa de vibração */
  }
}

export const haptics = {
  /** Toque de botão: um tique quase subliminar. */
  tap: () => buzz(8),
  /** Acerto: pulso único e firme. */
  correct: () => buzz(18),
  /** Erro: "trêmulo" duplo — inconfundível no bolso. */
  wrong: () => buzz([45, 40, 45]),
  /** Level-up / resgate: escadinha crescente. */
  levelUp: () => buzz([25, 35, 25, 35, 60]),
  /** Fim de fase aprovado: a fanfarra física. */
  fanfare: () => buzz([20, 30, 20, 30, 20, 30, 80]),
};
