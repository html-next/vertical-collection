import { assert } from '@ember/debug';

export default function estimateElementHeight(element, fallbackHeight) {
  assert(`You called estimateElement height without a fallbackHeight`, fallbackHeight);
  assert(`You called estimateElementHeight without an element`, element);

  if (fallbackHeight.indexOf('%') !== -1) {
    return getPercentageHeight(element, fallbackHeight);
  }

  if (fallbackHeight.indexOf('em') !== -1) {
    return getEmHeight(element, fallbackHeight);
  }

  return parseInt(fallbackHeight, 10);
}

function getPercentageHeight(element, fallbackHeight) {
  // We use offsetHeight here to get the element's true height, rather than the
  // bounding rect which may be scaled with transforms
  let parentHeight = element.offsetHeight;
  let percent = parseFloat(fallbackHeight);

  return (percent * parentHeight / 100.0);
}

function getEmHeight(element, fallbackHeight) {
  const fontSizeElement = fallbackHeight.indexOf('rem') !== -1 ? document.documentElement : element;
  const fontSize = window.getComputedStyle(fontSizeElement).getPropertyValue('font-size');

  return (parseFloat(fallbackHeight) * parseFloat(fontSize));
}
