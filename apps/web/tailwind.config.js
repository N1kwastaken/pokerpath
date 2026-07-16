/** @type {import('tailwindcss').Config} */
// Sistema de temas via CSS variables. Light (Preflop Wizard) é o padrão;
// dark é alternável. Tokens neutros vêm de --vars (definidos em index.css).
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Neutros que trocam com o tema
        bg: v('--bg'),
        card: v('--card'),
        card2: v('--card2'),
        line: v('--line'),
        title: v('--title'),
        text: v('--text'),
        subtle: v('--subtle'),
        primary: { DEFAULT: v('--primary'), press: v('--primary2'), soft: v('--primary-soft') },
        // Aliases legados (telas antigas continuam trocando de tema)
        ink: v('--title'),
        body: v('--text'),
        muted: v('--subtle'),
        surface: v('--line'),
        elevated: v('--card'),
        // Paleta fixa de marca/ações
        brand: { DEFAULT: '#1B8A4C', dark: '#145C34' },
        success: '#1B8A4C',
        gold: '#C9A84C',
        accent: '#7C5CFF',
        error: '#D9363E',
        danger: '#D9363E',
        call: '#3B82F6',
        felt: '#125A38',
        feltEdge: '#0A3322',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Arial', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl: '1rem', '2xl': '1.25rem', '3xl': '1.75rem' },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 12px 28px -16px rgba(16,24,40,0.18)',
        soft: '0 1px 2px rgba(16,24,40,0.05)',
        pop: '0 8px 24px -10px rgba(0,0,0,0.65)',
        glow: '0 6px 18px -8px rgba(0,0,0,0.6)',
        'glow-gold': '0 0 34px -6px rgba(245,196,81,0.55)',
        'glow-accent': '0 0 32px -6px rgba(124,92,255,0.5)',
      },
      keyframes: {
        'check-draw': { '0%': { strokeDashoffset: '26' }, '100%': { strokeDashoffset: '0' } },
        'pulse-correct': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.04)' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '20%': { transform: 'translateX(-8px)' }, '60%': { transform: 'translateX(8px)' } },
        'fade-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(40px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'logo-glow': { '0%,100%': { filter: 'drop-shadow(0 0 0 rgba(22,163,74,0))', transform: 'scale(1)' }, '50%': { filter: 'drop-shadow(0 0 18px rgba(22,163,74,0.55))', transform: 'scale(1.05)' } },
        'spin-in': { from: { transform: 'rotate(-180deg) scale(0.3)', opacity: '0' }, to: { transform: 'rotate(0) scale(1)', opacity: '1' } },
        // Idle do mascote: subir/descer puro parecia peça de máquina. Com um
        // balanço leve e fora de fase (o giro vira nos quartos, não no meio) o
        // movimento fica orgânico — o Ace parece respirar, não oscilar.
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(-1.5deg)' },
          '25%': { transform: 'translateY(-4px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(1.5deg)' },
          '75%': { transform: 'translateY(-4px) rotate(0deg)' },
        },
        'float-slow': { '0%,100%': { transform: 'translateY(0) rotate(0)' }, '50%': { transform: 'translateY(-16px) rotate(5deg)' } },
        'deal-in': { from: { transform: 'translateY(-40px) rotate(-8deg)', opacity: '0' }, to: { transform: 'translateY(0) rotate(0)', opacity: '1' } },
        'bubble-in': { from: { opacity: '0', transform: 'translateY(10px) scale(0.97)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
        'chip-pop': { from: { transform: 'scale(0)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        'grow-x': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        aurora: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '50%': { transform: 'translate(6%,-6%) scale(1.12)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        flame: { '0%,100%': { transform: 'scale(1) rotate(-2deg)' }, '50%': { transform: 'scale(1.1) rotate(2deg)' } },
        'confetti-fall': { '0%': { transform: 'translateY(-10vh) rotate(0)', opacity: '1' }, '100%': { transform: 'translateY(110vh) rotate(720deg)', opacity: '0' } },
      },
      animation: {
        'check-draw': 'check-draw 0.5s ease-out forwards',
        'pulse-correct': 'pulse-correct 0.5s ease-in-out',
        shake: 'shake 0.45s ease-in-out',
        'fade-in': 'fade-in 0.35s ease-out both',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'logo-glow': 'logo-glow 2.4s ease-in-out infinite',
        'spin-in': 'spin-in 0.7s cubic-bezier(0.22,1,0.36,1)',
        float: 'float 4.5s ease-in-out infinite',
        'float-slow': 'float-slow 7s ease-in-out infinite',
        'deal-in': 'deal-in 0.45s ease-out both',
        'bubble-in': 'bubble-in 0.35s ease-out both',
        'chip-pop': 'chip-pop 0.3s ease-out both',
        'grow-x': 'grow-x 0.7s cubic-bezier(0.22,1,0.36,1) both',
        'confetti-fall': 'confetti-fall 2.2s linear forwards',
        aurora: 'aurora 18s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        marquee: 'marquee 22s linear infinite',
        flame: 'flame 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
