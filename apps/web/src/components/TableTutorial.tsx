import { useState } from 'react';
import { Mascot } from './Mascot.js';
import { withAccentWord } from '../lib/accent.js';
import { sound } from '../lib/sound.js';

/**
 * Tutorial guiado da PRIMEIRA prática de mesa: o Ace apresenta a mesa, as
 * cartas, a posição, o pote e cada botão antes da primeira decisão.
 * Aparece uma única vez (localStorage) e termina liberando a mão guiada.
 */
const STEPS: { title: string; text: string }[] = [
  { title: 'Bem-vindo à mesa!', text: 'Aqui você treina decisões reais de poker, uma mão de cada vez. Vou te mostrar tudo rapidinho.' },
  { title: 'Suas cartas', text: 'As duas cartas grandes embaixo são a SUA mão. Só você as vê.' },
  // {cor} = cor de destaque escolhida pelo usuário (ver lib/accent.ts).
  { title: 'Você na mesa', text: 'O selo {cor} diz onde VOCÊ está sentado (ex.: BTN = botão, a melhor cadeira). Os outros jogadores aparecem ao redor.' },
  { title: 'O pote', text: 'No centro fica o POTE: as fichas em disputa. É isso que você quer ganhar.' },
  { title: 'Os botões', text: 'FOLD = desistir da mão. CALL = pagar uma aposta. RAISE = aumentar. Nas primeiras fases só existem duas respostas certas: Raise (mão forte) ou Fold (mão fraca).' },
  { title: 'Colou? Sem problema', text: 'No topo da fase, o botão de gráfico abre o GRÁFICO da sua posição — pode consultar sempre. E qualquer termo sublinhado (tipo range) abre o glossário ao tocar.' },
  { title: 'Errou? Tudo bem!', text: 'Cada resposta vem com a explicação do porquê — errar aqui é grátis e faz parte do treino. Vamos à sua primeira mão!' },
];

const KEY = 'pp.tableTutorialDone';

export function tableTutorialPending(): boolean {
  return !localStorage.getItem(KEY);
}

export function TableTutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  function next() {
    sound.click();
    if (last) {
      localStorage.setItem(KEY, '1');
      onDone();
    } else {
      setI(i + 1);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto max-w-md animate-slide-up rounded-3xl border border-line bg-card p-4 shadow-pop">
        <div className="flex items-start gap-3">
          <Mascot mood={last ? 'excited' : 'teaching'} size={92} float={false} />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-title">{step.title}</p>
            <p className="mt-1 text-sm leading-snug text-text">{withAccentWord(step.text)}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1">
            {STEPS.map((_, k) => <span key={k} className={`h-1.5 rounded-full ${k === i ? 'w-5 bg-primary' : 'w-1.5 bg-line'}`} />)}
          </div>
          <button onClick={next} className="btn-primary px-5 py-2 text-sm">{last ? 'Jogar!' : 'Próximo'}</button>
        </div>
      </div>
    </div>
  );
}
