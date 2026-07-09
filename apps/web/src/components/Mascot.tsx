import { useEffect, useState } from 'react';

/**
 * Ace — o mascote: a carta Ás de Espadas com carinha e bracinhos (estilo
 * cartoon rubber-hose). Cada mood reaproveita olhos/sobrancelhas/boca/braços.
 *
 * Quando usar:
 *  happy   — acerto / aula tranquila      sad   — erro
 *  excited — animação / novidade          win   — fase/mundo concluído (troféu)
 *  cheer   — comemoração                  teaching — explicando (aula)
 *  wave    — boas-vindas                  think — pergunta/quiz
 *  angry   — desafio difícil              sleep — inatividade/streak perdido
 *
 * Arte por imagem (PNG) tem prioridade: solte `public/mascot/<mood>.png`.
 */
export type MascotMood = 'happy' | 'excited' | 'cheer' | 'win' | 'teaching' | 'wave' | 'sad' | 'angry' | 'think' | 'sleep';

/**
 * Posição de cada mood no sheet de expressões (grade 5 colunas × 4 linhas):
 * [coluna, linha]. Linha 0: idle/happy/laughing/excited/wink · 1: thinking/
 * curious/surprised/shocked/proud · 2: focused/determined/angry/nervous/
 * confused · 3: sad/crying/sleepy/celebrating/victory.
 */
const SPRITE: Record<MascotMood, [number, number]> = {
  happy: [1, 0], wave: [4, 0], excited: [3, 0], cheer: [3, 3], win: [4, 3],
  teaching: [4, 1], think: [0, 1], sad: [0, 3], angry: [1, 2], sleep: [2, 3],
};
const GRID = { cols: 5, rows: 4 };

export function Mascot({ mood = 'happy', size = 120, float = true }: { mood?: MascotMood; size?: number; float?: boolean }) {
  const [sheetOk, setSheetOk] = useState(false);
  useEffect(() => {
    const im = new Image();
    im.onload = () => setSheetOk(true);
    im.onerror = () => setSheetOk(false);
    im.src = '/mascot-sheet.png';
  }, []);
  const [col, row] = SPRITE[mood];
  return (
    <div className={float ? 'animate-float' : ''} style={{ width: size, height: size }} role="img" aria-label={`Ace, o mascote (${mood})`}>
      {sheetOk ? (
        <div style={{
          width: size, height: size,
          backgroundImage: 'url(/mascot-sheet.png)',
          backgroundSize: `${GRID.cols * 100}% ${GRID.rows * 100}%`,
          backgroundPosition: `${(col * 100) / (GRID.cols - 1)}% ${(row * 100) / (GRID.rows - 1)}%`,
          backgroundRepeat: 'no-repeat',
          // Halo claro: braços/detalhes pretos do Ace somem no fundo escuro sem isso.
          filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.35)) drop-shadow(0 3px 8px rgba(0,0,0,0.45))',
        }} />
      ) : (
        <AceSvg mood={mood} size={size} />
      )}
    </div>
  );
}

type Cfg = {
  brows: 'none' | 'up' | 'down' | 'sad';
  eyes: 'open' | 'happy' | 'closed' | 'big';
  mouth: 'smile' | 'grin' | 'open' | 'frown' | 'flat';
  arms: 'rest' | 'up' | 'wave' | 'point' | 'fists' | 'chin' | 'droop' | 'trophy';
  tears?: boolean;
  extra?: 'sparkle' | 'zzz' | 'question';
};
const MOODS: Record<MascotMood, Cfg> = {
  happy:    { brows: 'none', eyes: 'open',   mouth: 'smile', arms: 'rest' },
  excited:  { brows: 'up',   eyes: 'big',    mouth: 'open',  arms: 'up',     extra: 'sparkle' },
  cheer:    { brows: 'up',   eyes: 'happy',  mouth: 'grin',  arms: 'up' },
  win:      { brows: 'none', eyes: 'happy',  mouth: 'grin',  arms: 'trophy', extra: 'sparkle' },
  teaching: { brows: 'up',   eyes: 'open',   mouth: 'smile', arms: 'point' },
  wave:     { brows: 'none', eyes: 'open',   mouth: 'smile', arms: 'wave' },
  sad:      { brows: 'sad',  eyes: 'open',   mouth: 'frown', arms: 'droop',  tears: true },
  angry:    { brows: 'down', eyes: 'open',   mouth: 'grin',  arms: 'fists' },
  think:    { brows: 'up',   eyes: 'open',   mouth: 'flat',  arms: 'chin',   extra: 'question' },
  sleep:    { brows: 'none', eyes: 'closed', mouth: 'flat',  arms: 'rest',   extra: 'zzz' },
};

const ARMS: Record<Cfg['arms'], { l: string; lg: [number, number]; r: string; rg: [number, number] }> = {
  rest:   { l: 'M34 86 Q24 98 22 106',  lg: [22, 106], r: 'M106 86 Q116 98 118 106', rg: [118, 106] },
  up:     { l: 'M34 82 Q20 62 18 48',   lg: [18, 48],  r: 'M106 82 Q120 62 122 48',  rg: [122, 48] },
  wave:   { l: 'M34 88 Q24 98 22 106',  lg: [22, 106], r: 'M106 80 Q124 58 120 44',  rg: [120, 42] },
  point:  { l: 'M34 90 Q26 98 30 102',  lg: [30, 102], r: 'M106 80 Q124 60 130 46',  rg: [132, 44] },
  fists:  { l: 'M34 86 Q22 90 20 98',   lg: [20, 100], r: 'M106 86 Q118 90 120 98',  rg: [120, 100] },
  chin:   { l: 'M34 88 Q26 100 24 108', lg: [24, 108], r: 'M106 88 Q92 98 82 92',    rg: [80, 90] },
  droop:  { l: 'M34 94 Q30 106 30 116', lg: [30, 116], r: 'M106 94 Q110 106 110 116', rg: [110, 116] },
  trophy: { l: 'M34 88 Q26 100 24 108', lg: [24, 108], r: 'M106 86 Q116 92 116 86',  rg: [116, 84] },
};

function Spade({ x, y, s, fill = '#16181D' }: { x: number; y: number; s: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -9 C6 -3 12 1 12 6 C12 11 7 12 3 9 C4 13 6 15 8 17 L-8 17 C-6 15 -4 13 -3 9 C-7 12 -12 11 -12 6 C-12 1 -6 -3 0 -9 Z" fill={fill} />
    </g>
  );
}
function Glove({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r="8.5" fill="#fff" stroke="#16181D" strokeWidth="3" />;
}

function AceSvg({ mood, size }: { mood: MascotMood; size: number }) {
  const c = MOODS[mood];
  const a = ARMS[c.arms];
  return (
    <svg viewBox="0 0 140 180" width={size} height={size}>
      {/* Braços (atrás da carta) */}
      <g stroke="#16181D" strokeWidth="7" strokeLinecap="round" fill="none">
        <path d={a.l} /><path d={a.r} />
      </g>

      {/* Carta */}
      <rect x="34" y="22" width="72" height="112" rx="11" fill="#fff" stroke="#16181D" strokeWidth="3.5" />
      {/* Cantos A♠ */}
      <text x="41" y="40" fontFamily="Inter, Arial" fontWeight="900" fontSize="13" fill="#16181D">A</text>
      <Spade x={41.5} y={48} s={0.42} />
      <g transform="rotate(180 99 116)">
        <text x="93" y="120" fontFamily="Inter, Arial" fontWeight="900" fontSize="13" fill="#16181D">A</text>
        <Spade x={97.5} y={108} s={0.42} />
      </g>
      {/* Espada-emblema (baixo-centro) */}
      <Spade x={70} y={112} s={1.0} fill="#16181D" />

      {/* Olhos */}
      {c.eyes === 'closed' ? (
        <g stroke="#16181D" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M50 64 Q58 70 66 64" /><path d="M74 64 Q82 70 90 64" />
        </g>
      ) : c.eyes === 'happy' ? (
        <g stroke="#16181D" strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M50 66 Q58 58 66 66" /><path d="M74 66 Q82 58 90 66" />
        </g>
      ) : (
        <g>
          <ellipse cx="58" cy="64" rx={c.eyes === 'big' ? 11 : 9} ry={c.eyes === 'big' ? 13 : 11} fill="#fff" stroke="#16181D" strokeWidth="2.5" />
          <ellipse cx="82" cy="64" rx={c.eyes === 'big' ? 11 : 9} ry={c.eyes === 'big' ? 13 : 11} fill="#fff" stroke="#16181D" strokeWidth="2.5" />
          <circle cx="59" cy="66" r="4.2" fill="#16181D" />
          <circle cx="83" cy="66" r="4.2" fill="#16181D" />
          <circle cx="60.5" cy="64" r="1.4" fill="#fff" /><circle cx="84.5" cy="64" r="1.4" fill="#fff" />
        </g>
      )}

      {/* Sobrancelhas */}
      {c.brows === 'up' && <g stroke="#16181D" strokeWidth="3" strokeLinecap="round"><path d="M50 50 Q58 46 66 49" /><path d="M74 49 Q82 46 90 50" /></g>}
      {c.brows === 'down' && <g stroke="#16181D" strokeWidth="3.4" strokeLinecap="round"><path d="M50 48 L66 54" /><path d="M90 48 L74 54" /></g>}
      {c.brows === 'sad' && <g stroke="#16181D" strokeWidth="3" strokeLinecap="round"><path d="M50 54 L66 49" /><path d="M90 54 L74 49" /></g>}

      {/* Boca */}
      {c.mouth === 'frown' && <path d="M58 90 Q70 82 82 90" fill="none" stroke="#16181D" strokeWidth="3.2" strokeLinecap="round" />}
      {c.mouth === 'flat' && <path d="M60 88 L80 88" stroke="#16181D" strokeWidth="3.2" strokeLinecap="round" />}
      {c.mouth === 'smile' && <path d="M58 86 Q70 96 82 86" fill="none" stroke="#16181D" strokeWidth="3.2" strokeLinecap="round" />}
      {(c.mouth === 'open' || c.mouth === 'grin') && (
        <g>
          <path d="M56 84 Q70 102 84 84 Q70 92 56 84 Z" fill="#3a1a22" stroke="#16181D" strokeWidth="2.5" strokeLinejoin="round" />
          {c.mouth === 'open' && <ellipse cx="70" cy="94" rx="6" ry="3.5" fill="#FF5E78" />}
          {c.mouth === 'grin' && <path d="M58 86 L82 86" stroke="#fff" strokeWidth="3" />}
        </g>
      )}

      {/* Bochechas */}
      {(mood === 'happy' || mood === 'excited' || mood === 'cheer' || mood === 'win' || mood === 'wave') && (
        <g fill="#FF6B81" opacity="0.45"><circle cx="48" cy="80" r="4" /><circle cx="92" cy="80" r="4" /></g>
      )}

      {/* Lágrimas */}
      {c.tears && <g fill="#5BC7F2"><path d="M55 72 q-3 7 0 9 q3 -2 0 -9z" /><path d="M85 72 q-3 7 0 9 q3 -2 0 -9z" /></g>}

      {/* Mãos (luvas) por cima */}
      <Glove x={a.lg[0]} y={a.lg[1]} /><Glove x={a.rg[0]} y={a.rg[1]} />

      {/* Troféu */}
      {c.arms === 'trophy' && (
        <g transform="translate(118 70)" stroke="#16181D" strokeWidth="2.5" fill="#F5C451">
          <path d="M-7 -8 H7 V-2 Q7 8 0 8 Q-7 8 -7 -2 Z" />
          <path d="M-7 -6 Q-13 -6 -13 -1 Q-13 3 -8 3" fill="none" />
          <path d="M7 -6 Q13 -6 13 -1 Q13 3 8 3" fill="none" />
          <rect x="-2" y="8" width="4" height="6" /><rect x="-6" y="14" width="12" height="3" rx="1" />
        </g>
      )}

      {/* Extras */}
      {c.extra === 'sparkle' && (
        <g fill="#F5C451">
          <path d="M24 36 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
          <path d="M116 30 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" />
        </g>
      )}
      {c.extra === 'question' && <text x="98" y="44" fontFamily="Inter, Arial" fontWeight="900" fontSize="22" fill="#16181D">?</text>}
      {c.extra === 'zzz' && (
        <g fill="#16181D" fontFamily="Inter, Arial" fontWeight="900">
          <text x="100" y="46" fontSize="11">z</text><text x="108" y="38" fontSize="14">z</text><text x="118" y="28" fontSize="18">z</text>
        </g>
      )}
    </svg>
  );
}

/** Balão de fala do mascote. */
export function MascotSpeech({ children }: { children: React.ReactNode }) {
  return <div className="speech animate-bubble-in max-w-xs text-sm leading-relaxed">{children}</div>;
}
