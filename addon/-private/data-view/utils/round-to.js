export default function roundTo(number, decimal = 2) {
  const exp = Math.pow(10, decimal);
  return Math.round(number * exp) / exp;
}
