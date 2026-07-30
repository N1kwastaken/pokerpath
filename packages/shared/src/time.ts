/**
 * Calendário do produto.
 *
 * O público inicial do PokerPath está no Brasil, enquanto o Render executa em
 * UTC. Toda regra diária precisa usar a mesma zona para energia, streak,
 * missões, e-mails e cronômetros virarem juntos.
 */
export const PRODUCT_TIME_ZONE = 'America/Sao_Paulo';

const DAY_MS = 86_400_000;
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: PRODUCT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

interface ZonedParts extends CalendarDate {
  hour: number;
  minute: number;
  second: number;
}

function zonedParts(date: Date): ZonedParts {
  const values = new Map(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.get('year') ?? 0,
    month: values.get('month') ?? 0,
    day: values.get('day') ?? 0,
    hour: values.get('hour') ?? 0,
    minute: values.get('minute') ?? 0,
    second: values.get('second') ?? 0,
  };
}

/** Diferença entre o relógio da zona do produto e UTC naquele instante. */
function offsetMs(date: Date): number {
  const parts = zonedParts(date);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const instantAtWholeSecond = Math.floor(date.getTime() / 1_000) * 1_000;
  return representedAsUtc - instantAtWholeSecond;
}

/** Converte meia-noite do calendário do produto no instante UTC correspondente. */
function productMidnight({ year, month, day }: CalendarDate): Date {
  const utcGuess = Date.UTC(year, month - 1, day);
  const firstOffset = offsetMs(new Date(utcGuess));
  let instant = utcGuess - firstOffset;
  // Segunda leitura cobre uma eventual troca de offset entre o palpite UTC e
  // a meia-noite real da zona, sem depender de biblioteca ou offset fixo.
  const finalOffset = offsetMs(new Date(instant));
  if (finalOffset !== firstOffset) instant = utcGuess - finalOffset;
  return new Date(instant);
}

function shiftCalendar(date: CalendarDate, days: number): CalendarDate {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function calendarOrdinal(date: Date): number {
  const parts = zonedParts(date);
  return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / DAY_MS);
}

export function productDayKey(date: Date = new Date()): string {
  const { year, month, day } = zonedParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function productDayIndex(date: Date = new Date()): number {
  return calendarOrdinal(date);
}

export function startOfProductDay(date: Date = new Date()): Date {
  return productMidnight(zonedParts(date));
}

export function startOfProductWeek(date: Date = new Date()): Date {
  const parts = zonedParts(date);
  const calendar = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const daysSinceMonday = (calendar.getUTCDay() + 6) % 7;
  return productMidnight(shiftCalendar(parts, -daysSinceMonday));
}

export function nextProductDayStart(date: Date = new Date()): Date {
  return productMidnight(shiftCalendar(zonedParts(date), 1));
}

export function nextProductWeekStart(date: Date = new Date()): Date {
  const weekStart = zonedParts(startOfProductWeek(date));
  return productMidnight(shiftCalendar(weekStart, 7));
}

/** Dias de calendário, não janelas de 24h — a base correta para streak. */
export function differenceInProductDays(a: Date, b: Date): number {
  return calendarOrdinal(a) - calendarOrdinal(b);
}
