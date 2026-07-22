import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { highlightSegments, type GlossaryEntry } from '../lib/glossary.js';
import { withAccentWord } from '../lib/accent.js';

// Só um balão aberto por vez (fecha o anterior ao abrir outro).
let activeClose: (() => void) | null = null;

// Altura de folga que um balão precisa para caber. Não dá para medir antes de
// renderizar, então é uma estimativa generosa: errar para mais só faz o balão
// abrir para cima cedo demais, e isso é inofensivo.
const BUBBLE_ROOM = 150;

/** Termo realçado (verde) que abre um balão explicando ao clicar (estilo Wikipedia). */
function TermTip({ entry, children }: { entry: GlossaryEntry; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, above: false });
  const ref = useRef<HTMLSpanElement>(null);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (open) { setOpen(false); activeClose = null; return; }
    activeClose?.(); // fecha qualquer balão aberto antes
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2, 130), window.innerWidth - 130);
    // O termo costuma estar no cartão de feedback, colado no rodapé: abrir
    // para baixo jogaria o balão para fora da tela. Vira para cima quando não
    // há espaço embaixo (e só então — para cima é sempre o segundo melhor).
    const above = r.bottom + BUBBLE_ROOM > window.innerHeight && r.top > BUBBLE_ROOM;
    setPos({ x, y: above ? r.top : r.bottom, above });
    setOpen(true);
    activeClose = () => setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const close = () => { setOpen(false); activeClose = null; };
    document.addEventListener('click', close);
    document.addEventListener('scroll', close, true);
    return () => { document.removeEventListener('click', close); document.removeEventListener('scroll', close, true); };
  }, [open]);

  return (
    <>
      <span ref={ref} onClick={toggle}
        className="cursor-pointer rounded bg-primary/15 px-0.5 font-semibold text-primary underline decoration-primary/40 decoration-dotted underline-offset-2">
        {children}
      </span>
      {open && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: pos.x,
            top: pos.above ? undefined : pos.y + 6,
            bottom: pos.above ? window.innerHeight - pos.y + 6 : undefined,
            transform: 'translateX(-50%)', zIndex: 1000, maxWidth: 260,
          }}
          className="animate-bubble-in rounded-xl border border-line bg-card p-3 text-sm leading-snug text-text shadow-pop"
        >
          <p className="mb-1 font-extrabold text-primary">{entry.term}</p>
          <p>{entry.def}</p>
        </div>,
        document.body,
      )}
    </>
  );
}

/**
 * Renderiza um texto realçando termos do glossário (clicáveis).
 * Também resolve o placeholder {cor} — a cor de destaque é escolhida pelo
 * usuário, então o texto não pode cravar "verde".
 */
export function Glossarized({ text }: { text: string }) {
  const segs = useMemo(() => highlightSegments(withAccentWord(text)), [text]);
  return <>{segs.map((s, i) => (s.entry ? <TermTip key={i} entry={s.entry}>{s.text}</TermTip> : <span key={i}>{s.text}</span>))}</>;
}
