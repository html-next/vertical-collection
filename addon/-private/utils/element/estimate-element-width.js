import { assert } from '@ember/debug';

export default function estimateElementWidth(element, fallbackWidth) {
  assert(`You called estimateElement width without a fallbackWidth`, fallbackWidth);
  assert(`You called estimateElementWidth without an element`, element);

  if (fallbackWidth.indexOf('%') !== -1) {
    return getPercentageWidth(element, fallbackWidth);
  }

  if (fallbackWidth.indexOf('em') !== -1) {
    return getEmWidth(element, fallbackWidth);
  }

  return parseInt(fallbackWidth, 10);
}

function getPercentageWidth(element, fallbackWidth) {
  // We use offsetWidth here to get the element's true height, rather than the
  // bounding rect which may be scaled with transforms
  let parentWidth = element.offsetWidth;
  let percent = parseFloat(fallbackWidth);

  return (percent * parentWidth / 100.0);
}

function getEmWidth(element, fallbackWidth) {
  const fontSizeElement = fallbackWidth.indexOf('rem') !== -1 ? document.documentElement : element;
  const fontSize = window.getComputedStyle(fontSizeElement).getPropertyValue('font-size');

  return (parseFloat(fallbackWidth) * parseFloat(fontSize));
}
