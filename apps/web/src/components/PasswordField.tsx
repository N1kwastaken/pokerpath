import { useState } from 'react';
import { IconEye, IconEyeOff } from './Icons.js';

/** Campo de senha com botão de mostrar/ocultar (olhinho). */
export function PasswordField({ value, onChange, placeholder, autoComplete }: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: 'current-password' | 'new-password';
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input className="field w-full pr-11" type={visible ? 'text' : 'password'}
        placeholder={placeholder} autoComplete={autoComplete}
        value={value} onChange={(e) => onChange(e.target.value)} />
      <button type="button" onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-text">
        {visible ? <IconEyeOff size={19} /> : <IconEye size={19} />}
      </button>
    </div>
  );
}
