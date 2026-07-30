/**
 * Aparência da mesa é uma preferência do aparelho: não muda progresso nem
 * estratégia e deve funcionar antes mesmo de sincronizar a conta.
 */
export type FeltStyle = 'accent' | 'classic' | 'night';
export type CardBackStyle = 'accent' | 'blue' | 'ruby';
export type TableBrandStyle = 'subtle' | 'hidden';

export interface TablePrefs {
  felt: FeltStyle;
  cardBack: CardBackStyle;
  brand: TableBrandStyle;
}

export const DEFAULT_TABLE_PREFS: TablePrefs = {
  felt: 'accent',
  cardBack: 'accent',
  brand: 'subtle',
};

const KEY = 'pp.tablePrefs';
const FELTS = new Set<FeltStyle>(['accent', 'classic', 'night']);
const CARD_BACKS = new Set<CardBackStyle>(['accent', 'blue', 'ruby']);
const BRANDS = new Set<TableBrandStyle>(['subtle', 'hidden']);

export function readTablePrefs(): TablePrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<TablePrefs>;
    return {
      felt: raw.felt && FELTS.has(raw.felt) ? raw.felt : DEFAULT_TABLE_PREFS.felt,
      cardBack: raw.cardBack && CARD_BACKS.has(raw.cardBack) ? raw.cardBack : DEFAULT_TABLE_PREFS.cardBack,
      brand: raw.brand && BRANDS.has(raw.brand) ? raw.brand : DEFAULT_TABLE_PREFS.brand,
    };
  } catch {
    return DEFAULT_TABLE_PREFS;
  }
}

export function saveTablePrefs(prefs: TablePrefs): void {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}
