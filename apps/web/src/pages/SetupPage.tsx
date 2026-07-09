import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mascot } from '../components/Mascot.js';
import { LessonHandTable } from '../components/LessonHandTable.js';
import { ACCENTS, applyAccent, currentAccent } from '../lib/accent.js';
import { sound } from '../lib/sound.js';

/**
 * Montagem do app ANTES do cadastro (efeito IKEA, estilo Duolingo): o visitante
 * responde, escolhe a cor do próprio app e já joga uma mão — só então criamos
 * a conta ("continue para salvar o SEU app"). Respostas ficam em pp.setup e
 * viram o onboarding automaticamente após o cadastro.
 */
export type SetupData = { name: string; experience: string; goal: string };
export const SETUP_KEY = 'pp.setup';

const EXP_OPTIONS = [
  { key: 'beginner', label: 'Nunca joguei', emoji: '🌱' },
  { key: 'recreational', label: 'Jogo de vez em quando', emoji: '🎲' },
  { key: 'intermediate', label: 'Jogo bastante', emoji: '🃏' },
];
const GOAL_OPTIONS = [
  { key: 'learn', label: 'Aprender do zero', emoji: '📚' },
  { key: 'improve', label: 'Parar de perder dinheiro', emoji: '📈' },
  { key: 'review', label: 'Afiar meu jogo', emoji: '🎯' },
];

export function SetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [experience, setExperience] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [accent, setAccent] = useState(currentAccent());
  const [demoPick, setDemoPick] = useState<'FOLD' | 'RAISE' | null>(null);

  const TOTAL = 6;
  function next() { sound.click(); setStep((s) => s + 1); }

  function finishToRegister() {
    const data: SetupData = { name: name.trim(), experience: experience ?? 'beginner', goal: goal ?? 'learn' };
    localStorage.setItem(SETUP_KEY, JSON.stringify(data));
    navigate('/register');
  }

  const canNext =
    step === 0 ? true
    : step === 1 ? name.trim().length >= 2
    : step === 2 ? experience !== null
    : step === 3 ? goal !== null
    : step === 4 ? true
    : demoPick !== null;

  return (
    <div className="flex min-h-dvh flex-col px-6 py-8">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">Montando o seu app</span>
        <span className="text-xs font-bold tabular-nums text-subtle">{step + 1}/{TOTAL}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card2">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((step + 1) / TOTAL) * 100}%` }} />
      </div>

      <div className="flex flex-1 flex-col justify-center py-6">
        {step === 0 && (
          <div className="text-center">
            <Mascot mood="wave" size={150} />
            <h1 className="mt-4 text-2xl font-bold text-title">Vamos montar o seu PokerPath</h1>
            <p className="mt-2 text-text">Algumas escolhas rápidas e você já começa a jogar — a conta fica pra depois.</p>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-title">Como devemos te chamar?</h1>
            <input autoFocus className="field mt-5 w-full" type="text" placeholder="Seu nome" value={name}
              onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && canNext && next()} />
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-title">{name.trim() ? `${name.trim()}, você` : 'Você'} já jogou poker?</h1>
            <div className="mt-5 space-y-2.5">
              {EXP_OPTIONS.map((o) => (
                <button key={o.key} onClick={() => { sound.click(); setExperience(o.key); }}
                  className={`chip w-full text-left ${experience === o.key ? 'chip-on' : 'chip-off'}`}>
                  {o.emoji} {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-title">Qual é o seu objetivo?</h1>
            <div className="mt-5 space-y-2.5">
              {GOAL_OPTIONS.map((o) => (
                <button key={o.key} onClick={() => { sound.click(); setGoal(o.key); }}
                  className={`chip w-full text-left ${goal === o.key ? 'chip-on' : 'chip-off'}`}>
                  {o.emoji} {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold text-title">Escolha a cor do SEU app</h1>
            <p className="mt-1 text-sm text-subtle">Aplicada na hora — dá pra trocar depois no perfil.</p>
            <div className="mt-5 grid grid-cols-5 gap-3">
              {ACCENTS.map((a) => (
                <button key={a.key} onClick={() => { sound.click(); setAccent(a.key); applyAccent(a.key); }}
                  aria-label={a.name}
                  className={`aspect-square rounded-2xl transition-transform ${accent === a.key ? 'scale-110 ring-4 ring-white/40' : 'opacity-80'}`}
                  style={{ backgroundColor: a.hex }} />
              ))}
            </div>
            <p className="mt-3 text-center text-sm font-bold text-primary">{ACCENTS.find((a) => a.key === accent)?.name}</p>
          </div>
        )}

        {step === 5 && (
          <div>
            <h1 className="text-2xl font-bold text-title">Jogue sua primeira mão!</h1>
            <p className="mt-1 text-sm text-subtle">Você está no botão com um par de Ases — a melhor mão do jogo.</p>
            <div className="mt-4"><LessonHandTable position="BTN" hand="A♠A♥" /></div>
            {demoPick ? (
              <div className={`mt-3 rounded-2xl border p-4 ${demoPick === 'RAISE' ? 'border-primary/40 bg-primary/10' : 'border-error/40 bg-error/10'}`}>
                <p className={`font-bold ${demoPick === 'RAISE' ? 'text-primary' : 'text-error'}`}>
                  {demoPick === 'RAISE' ? 'Isso! 🎉 Com AA, sempre aumente.' : 'Quase! AA é a melhor mão — o certo era aumentar (Raise).'}
                </p>
                <p className="mt-0.5 text-sm text-text">Viu como funciona? É assim que você vai aprender: jogando.</p>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button onClick={() => { setDemoPick('FOLD'); sound.wrong(); }} className="btn3d rounded-2xl bg-subtle py-4 font-bold text-white">Fold</button>
                <button onClick={() => { setDemoPick('RAISE'); sound.correct(); }} className="btn3d rounded-2xl bg-primary py-4 font-bold text-white">Raise</button>
              </div>
            )}
          </div>
        )}
      </div>

      {step === 5 && demoPick ? (
        <button className="btn-primary w-full text-lg" onClick={finishToRegister}>
          Salvar o meu app — criar conta →
        </button>
      ) : step !== 5 && (
        <button className="btn-primary w-full text-lg" disabled={!canNext} onClick={next}>
          {step === 0 ? 'Começar' : 'Continuar'}
        </button>
      )}
    </div>
  );
}
