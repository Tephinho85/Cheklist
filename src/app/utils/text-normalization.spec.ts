import { describe, expect, it } from 'vitest';
import { converterParaMaiusculo, normalizarTextoMaiusculo } from './text-normalization';

describe('normalizarTextoMaiusculo', () => {
  it('converts text with accents to uppercase and trims its edges', () => {
    expect(normalizarTextoMaiusculo('  Produção e inspeção  ')).toBe('PRODUÇÃO E INSPEÇÃO');
  });

  it('returns an empty string for empty input', () => {
    expect(normalizarTextoMaiusculo(null)).toBe('');
  });

  it('converts typed text without trimming spaces between words', () => {
    expect(converterParaMaiusculo('área de produção')).toBe('ÁREA DE PRODUÇÃO');
  });
});
