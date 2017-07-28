import { assert } from 'vertical-collection/-debug/helpers';

export default function estimateElementHeight(element, fallbackHeight) {
  assert(`You called estimateElement height without a fallbackHeight`, fallbackHeight);
  assert(`You called estimateElementHeight without an element`, element);

  if (fallbackHeight.indexOf('%') !== -1) {
    let parentHeight = element.getBoundingClientRect().height;
    let per = parseFloat(fallbackHeight);

    return Math.max(per * parentHeight / 100, 1);
  }

  if (fallbackHeight.indexOf('em') !== -1) {
    const fontSizeElement = fallbackHeight.indexOf('rem') !== -1 ? document.body : element;
    const fontSize = window.getComputedStyle(fontSizeElement).getPropertyValue('font-size');
    const estimateHeight = parseFloat(fallbackHeight) * parseFloat(fontSize);

    return Math.max(estimateHeight, 1);
  }

  // px or no units
  return Math.max(parseInt(fallbackHeight, 10), 1);
}
