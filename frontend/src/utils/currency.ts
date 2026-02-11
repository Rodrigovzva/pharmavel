/**
 * Moneda del sistema: bolivianos (Bs.)
 */

export const CURRENCY_SYMBOL = 'Bs.';
export const CURRENCY_LABEL = 'bolivianos';

/**
 * Formatea un número como moneda en bolivianos (ej: "Bs. 1.234,56").
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formatea un número con 2 decimales para mostrar como monto (sin símbolo si se prefiere).
 */
export function formatMonto(value: number): string {
  return `${CURRENCY_SYMBOL} ${Number(value).toFixed(2)}`;
}
