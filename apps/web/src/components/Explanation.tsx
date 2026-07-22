import { Glossarized } from './Glossarized.js';

/**
 * Explicação estruturada do feedback.
 *
 * O texto vem do seed em UMA string (o campo é `String` no Prisma) com um
 * formato simples: a 1ª linha é o título e cada linha começando com "• " é um
 * tópico. Explicações antigas de uma frase só continuam funcionando — viram
 * o título, sem tópico nenhum.
 *
 *   Você apostou porque:
 *   • Este board favorece o *seu* range.
 *   • O BB quase nunca acerta A-K-x.
 *
 * `*palavra*` vira negrito. Os termos do glossário são realçados pelo
 * Glossarized (é ele que abre o balão), então aqui não se marca nada à mão.
 */
export function Explanation({ text }: { text: string }) {
  const [head, ...rest] = text.split('\n');
  const bullets = rest.map((l) => l.replace(/^[•\-]\s*/, '').trim()).filter(Boolean);

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-bold leading-snug text-title"><Rich text={head} /></p>
      {bullets.length > 0 && (
        <ul className="space-y-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm leading-snug text-text">
              <span aria-hidden className="mt-[0.15rem] shrink-0 text-primary">•</span>
              <span className="min-w-0"><Rich text={b} /></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Aplica o negrito de `*assim*` e passa o resto pelo glossário. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1
          ? <strong key={i} className="font-bold text-title">{p}</strong>
          : <Glossarized key={i} text={p} />,
      )}
    </>
  );
}
