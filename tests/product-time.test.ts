import { describe, expect, it } from 'vitest';
import {
  PRODUCT_TIME_ZONE,
  differenceInProductDays,
  nextProductDayStart,
  nextProductWeekStart,
  productDayKey,
  startOfProductDay,
  startOfProductWeek,
} from '@pokerpath/shared';

describe('calendário do PokerPath', () => {
  it('usa explicitamente o horário de Brasília em vez do fuso do servidor', () => {
    expect(PRODUCT_TIME_ZONE).toBe('America/Sao_Paulo');

    const beforeMidnight = new Date('2026-07-30T02:59:59.000Z');
    const atMidnight = new Date('2026-07-30T03:00:00.000Z');

    expect(productDayKey(beforeMidnight)).toBe('2026-07-29');
    expect(productDayKey(atMidnight)).toBe('2026-07-30');
    expect(startOfProductDay(beforeMidnight).toISOString()).toBe('2026-07-29T03:00:00.000Z');
    expect(startOfProductDay(atMidnight).toISOString()).toBe('2026-07-30T03:00:00.000Z');
  });

  it('faz energia, missões e cronômetros apontarem para a mesma virada', () => {
    const wednesday = new Date('2026-07-29T18:00:00.000Z');

    expect(nextProductDayStart(wednesday).toISOString()).toBe('2026-07-30T03:00:00.000Z');
    expect(startOfProductWeek(wednesday).toISOString()).toBe('2026-07-27T03:00:00.000Z');
    expect(nextProductWeekStart(wednesday).toISOString()).toBe('2026-08-03T03:00:00.000Z');
  });

  it('conta streak por dia de calendário, não por janelas de 24 horas', () => {
    const lateMonday = new Date('2026-07-28T02:55:00.000Z');
    const earlyTuesday = new Date('2026-07-28T03:05:00.000Z');

    expect(differenceInProductDays(earlyTuesday, lateMonday)).toBe(1);
  });
});
