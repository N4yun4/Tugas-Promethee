/** Display-only rounding to 6 decimals (as in the report); stored values keep full precision. */
export function formatNilai(value: number): string {
  return String(Number(value.toFixed(6)));
}
