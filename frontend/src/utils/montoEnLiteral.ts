/**
 * Convierte un monto numerico a literal en espanol (ej: 98.40 -> "noventa y ocho con 40/100 bolivianos")
 */
export function montoEnLiteral(value: number): string {
  const entero = Math.floor(value);
  const centavos = Math.round((value - entero) * 100);
  const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const DECENAS = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const ESPECIALES: Record<number, string> = {
    11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
    16: 'dieciseis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve',
    20: 'veinte', 21: 'veintiuno', 22: 'veintidos', 23: 'veintitres', 30: 'treinta', 100: 'cien',
  };
  function hasta99(n: number): string {
    if (n === 0) return '';
    if (n < 10) return UNIDADES[n];
    if (n >= 11 && n <= 19) return ESPECIALES[n] ?? '';
    if (n === 20) return 'veinte';
    if (n < 30) return 'veinti' + UNIDADES[n - 20];
    if (n < 100) {
      const dec = Math.floor(n / 10);
      const u = n % 10;
      return (DECENAS[dec] + (u ? ' y ' + UNIDADES[u] : '')).trim();
    }
    return String(n);
  }
  const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
  function hasta999(n: number): string {
    if (n === 0) return '';
    if (n < 100) return hasta99(n);
    const c = Math.floor(n / 100);
    const r = n % 100;
    const base = c === 1 && r === 0 ? 'cien' : CENTENAS[c];
    return base + (r ? ' ' + hasta99(r) : '');
  }
  function miles(n: number): string {
    if (n === 0) return '';
    if (n < 1000) return hasta999(n);
    const m = Math.floor(n / 1000);
    const r = n % 1000;
    const mil = m === 1 ? 'mil' : hasta999(m) + ' mil';
    return mil + (r ? ' ' + hasta999(r) : '');
  }
  const parteEntera = entero === 0 ? 'cero' : miles(entero);
  const parteDecimal = centavos > 0 ? ' con ' + String(centavos) + '/100' : '';
  return parteEntera + parteDecimal + ' bolivianos';
}
