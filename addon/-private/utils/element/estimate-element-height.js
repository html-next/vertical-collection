import { assert } from '@ember/debug';

export function estimateElementHeight(element, fallbackHeight) {
  assert(`You called estimateElement height without a fallbackHeight`, fallbackHeight);
  assert(`You called estimateElementHeight without an element`, element);

  if (fallbackHeight.indexOf('%') !== -1) {
    return Math.max(getPercentageHeight(element, fallbackHeight), 1);
  }

  if (fallbackHeight.indexOf('em') !== -1) {
    return Math.max(getEmHeight(element, fallbackHeight), 1);
  }

  // px or no units
  return Math.max(parseInt(fallbackHeight, 10), 1);
}

/**
 * Returns estimated max height of an element.
 */
export function estimateElementMaxHeight(element) {
  const maxHeightString = window.getComputedStyle(element).maxHeight;
  if (maxHeightString.indexOf('%') !== -1) {
    return getPercentageHeight(element, maxHeightString);
  }

  if (maxHeightString.indexOf('em') !== -1) {
    return getEmHeight(element, maxHeightString);
  }

  // px or no units
  return parseInt(maxHeightString, 10);
}

function getPercentageHeight(element, fallbackHeight) {
  let parentHeight = element.getBoundingClientRect().height;
  let per = parseFloat(fallbackHeight);

  return per * parentHeight / 100.0;
}

function getEmHeight(element, fallbackHeight) {
  const fontSizeElement = fallbackHeight.indexOf('rem') !== -1 ? document.body : element;
  const fontSize = window.getComputedStyle(fontSizeElement).getPropertyValue('font-size');

  return parseFloat(fallbackHeight) * parseFloat(fontSize);
}
