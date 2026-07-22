import { useEffect } from 'react';

/**
 * Trava a rolagem do DOCUMENTO enquanto uma tela cheia está aberta.
 *
 * `position: fixed` cobre a tela mas NÃO impede o documento atrás de rolar:
 * no celular, arrastar sobre o overlay ainda arrasta a página de baixo — no
 * modo revisão dava para rolar a lista de erros enquanto se resolvia um.
 *
 * Só `overflow: hidden` (sem `touch-action`): os contêineres internos com
 * rolagem própria — o cartão de feedback — precisam continuar funcionando.
 */
export function useScrollLock(active = true): void {
  useEffect(() => {
    if (!active) return;
    const html = document.documentElement;
    const body = document.body;
    const y = window.scrollY;
    const prev = { html: html.style.overflow, body: body.style.overflow };

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      html.style.overflow = prev.html;
      body.style.overflow = prev.body;
      // Devolve a posição: travar/destravar sozinho joga a página para o topo.
      window.scrollTo(0, y);
    };
  }, [active]);
}
