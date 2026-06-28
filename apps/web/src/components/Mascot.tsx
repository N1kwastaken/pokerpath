import { useEffect, useState } from 'react';

/**
 * Pip — o mascote (naipe de espadas com carinha).
 *
 * Estratégia de arte: usa ILUSTRAÇÕES (PNG) quando existirem em
 * `public/mascot/<mood>.png` — basta soltar os arquivos lá que o app passa a
 * usá-los automaticamente. Enquanto não houver imagem, mostra um fallback SVG
 * (sem flash de imagem quebrada). Veja public/mascot/README.md.
 */
export type MascotMood = 'happy' | 'excited' | 'teaching' | 'sad' | 'wave' | 'cheer';

export function Mascot({ mood = 'happy', size = 120, float = true }: { mood?: MascotMood; size?: number; float?: boolean }) {
  const [imgOk, setImgOk] = useState(false);
  useEffect(() => { setImgOk(false); }, [mood]);

  return (
    <div className={float ? 'animate-float' : ''} style={{ width: size, height: size }} role="img" aria-label={`Pip, o mascote (${mood})`}>
      <img
        src={`/mascot/${mood}.png`}
        alt=""
        width={size}
        height={size}
        onLoad={() => setImgOk(true)}
        onError={() => setImgOk(false)}
        style={{ display: imgOk ? 'block' : 'none', width: size, height: size, objectFit: 'contain' }}
      />
      {!imgOk && <SpadeSvg mood={mood} size={size} />}
    </div>
  );
}

/** Fallback vetorial (usado até as ilustrações PNG serem adicionadas). */
function SpadeSvg({ mood, size }: { mood: MascotMood; size: number }) {
  const lookUp = mood === 'excited' || mood === 'cheer' ? -2 : mood === 'sad' ? 2 : -0.5;
  const openMouth = mood === 'excited' || mood === 'cheer' || mood === 'wave' || mood === 'happy';
  const thumb = mood === 'happy' || mood === 'wave' || mood === 'cheer';

  const arms: Record<MascotMood, { ld: string; lh: [number, number]; rd: string; rh: [number, number] }> = {
    happy:    { ld: 'M32 84 Q24 92 22 99',  lh: [22, 99],  rd: 'M88 82 Q98 76 104 66',  rh: [104, 64] },
    wave:     { ld: 'M32 84 Q24 92 22 99',  lh: [22, 99],  rd: 'M88 80 Q102 62 108 50', rh: [108, 48] },
    cheer:    { ld: 'M32 80 Q18 64 16 50',  lh: [16, 50],  rd: 'M88 80 Q102 64 104 50', rh: [104, 50] },
    excited:  { ld: 'M32 82 Q20 68 18 56',  lh: [18, 56],  rd: 'M88 82 Q100 68 102 56', rh: [102, 56] },
    teaching: { ld: 'M32 86 Q27 90 33 92',  lh: [34, 92],  rd: 'M88 80 Q102 66 110 56', rh: [110, 56] },
    sad:      { ld: 'M33 85 Q29 95 29 103', lh: [29, 103], rd: 'M87 85 Q91 95 91 103',  rh: [91, 103] },
  };
  const a = arms[mood];

  return (
    <svg viewBox="0 0 130 150" width={size} height={size}>
      <defs>
        <radialGradient id="sg" cx="42%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#4A5161" />
          <stop offset="55%" stopColor="#2A3140" />
          <stop offset="100%" stopColor="#12161F" />
        </radialGradient>
      </defs>

      {/* Braços */}
      <g stroke="#1A1F29" strokeWidth="7" strokeLinecap="round" fill="none">
        <path d={a.ld} /><path d={a.rd} />
      </g>
      {/* Mãos (luvas) */}
      <Glove x={a.lh[0]} y={a.lh[1]} />
      <Glove x={a.rh[0]} y={a.rh[1]} thumb={thumb} />

      {/* Corpo espada */}
      <path d="M65 14 C46 34 24 50 24 71 C24 88 44 92 56 79 C53 94 46 101 39 106 L91 106 C84 101 77 94 74 79 C86 92 106 88 106 71 C106 50 84 34 65 14 Z"
        fill="url(#sg)" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
      <ellipse cx="48" cy="40" rx="13" ry="18" fill="#fff" opacity="0.10" transform="rotate(-18 48 40)" />

      {/* Olhos grandes */}
      <g>
        <ellipse cx="50" cy="56" rx="11" ry="13" fill="#fff" />
        <ellipse cx="74" cy="56" rx="11" ry="13" fill="#fff" />
        <circle cx="51" cy={59 + lookUp} r="5.4" fill="#12161F" />
        <circle cx="75" cy={59 + lookUp} r="5.4" fill="#12161F" />
        <circle cx="53" cy={56.5 + lookUp} r="1.8" fill="#fff" />
        <circle cx="77" cy={56.5 + lookUp} r="1.8" fill="#fff" />
      </g>

      {/* Sobrancelhas */}
      {mood === 'teaching' && <path d="M67 44 L82 41" stroke="#0B0E13" strokeWidth="2.6" strokeLinecap="round" />}
      {mood === 'sad' && (
        <g stroke="#0B0E13" strokeWidth="2.6" strokeLinecap="round">
          <path d="M42 46 L56 50" /><path d="M82 46 L68 50" />
        </g>
      )}

      {/* Boca */}
      {mood === 'sad' ? (
        <path d="M54 86 Q64 78 74 86" fill="none" stroke="#0B0E13" strokeWidth="3" strokeLinecap="round" />
      ) : openMouth ? (
        <g>
          <path d="M50 74 Q64 94 78 74 Q64 82 50 74 Z" fill="#23121A" stroke="#0B0E13" strokeWidth="2" strokeLinejoin="round" />
          <ellipse cx="64" cy="85" rx="7" ry="4.5" fill="#FF5E78" />
        </g>
      ) : (
        <path d="M55 80 Q64 88 73 80" fill="none" stroke="#0B0E13" strokeWidth="3" strokeLinecap="round" />
      )}

      {/* Bochechas */}
      {mood !== 'sad' && mood !== 'teaching' && (
        <g fill="#FF6B81" opacity="0.5"><circle cx="40" cy="72" r="3.6" /><circle cx="88" cy="72" r="3.6" /></g>
      )}
    </svg>
  );
}

function Glove({ x, y, thumb = false }: { x: number; y: number; thumb?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r="8" fill="#fff" stroke="#0000001f" />
      {thumb && <rect x={x - 2.4} y={y - 16} width="5" height="10" rx="2.5" fill="#fff" stroke="#0000001f" />}
    </g>
  );
}

/** Balão de fala do mascote. */
export function MascotSpeech({ children }: { children: React.ReactNode }) {
  return <div className="speech animate-bubble-in max-w-xs text-sm leading-relaxed">{children}</div>;
}
