import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_TABLE_PREFS,
  readTablePrefs,
  saveTablePrefs,
} from '../apps/web/src/lib/tablePrefs.js';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
});

describe('preferências visuais da mesa', () => {
  it('usa uma aparência segura quando ainda não há escolha', () => {
    expect(readTablePrefs()).toEqual(DEFAULT_TABLE_PREFS);
  });

  it('persiste feltro, verso e marca escolhidos', () => {
    saveTablePrefs({ felt: 'night', cardBack: 'ruby', brand: 'hidden' });

    expect(readTablePrefs()).toEqual({
      felt: 'night',
      cardBack: 'ruby',
      brand: 'hidden',
    });
  });

  it('ignora valores adulterados no armazenamento local', () => {
    localStorage.setItem('pp.tablePrefs', JSON.stringify({
      felt: 'rainbow',
      cardBack: 'transparent',
      brand: 'giant',
    }));

    expect(readTablePrefs()).toEqual(DEFAULT_TABLE_PREFS);
  });
});
