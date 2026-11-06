export function converterParaMaiusculo(value: string | null | undefined): string {
  return (value || '').toLocaleUpperCase('pt-BR');
}

export function normalizarTextoMaiusculo(value: string | null | undefined): string {
  return converterParaMaiusculo(value).trim();
}
