export default function roundTo(number: number, decimal = 2): number {
  const exp = Math.pow(10, decimal);
  return Math.round(number * exp) / exp;
}
