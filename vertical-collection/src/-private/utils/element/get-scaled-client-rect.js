export default function getScaledClientRect(element, scale) {
  const rect = element.getBoundingClientRect();

  if (scale === 1) {
    return rect;
  }

  const scaled = {};

  for (let key in rect) {
    scaled[key] = rect[key] * scale;
  }

  return scaled;
}
