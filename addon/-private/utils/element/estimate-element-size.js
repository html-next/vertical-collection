import { assert } from '@ember/debug';

export default function estimateElementSize(element, fallbackSize, dimension = 'height') {
  assert(`You called estimateElement height without a fallbackSize`, fallbackSize);
  assert(`You called estimateElementHeight without an element`, element);

  if (fallbackSize.indexOf('%') !== -1) {
    return getPercentageSize(element, fallbackSize, dimension);
  }

  if (fallbackSize.indexOf('em') !== -1) {
    return getEmSize(element, fallbackSize);
  }

  return parseInt(fallbackSize, 10);
}

function getPercentageSize(element, fallbackSize, dimension) {
  // We use offsetHeight/offsetWidth here to get the element's true size, rather than the
  // bounding rect which may be scaled with transforms
  let parentSize = dimension === 'height' ? element.offsetHeight : element.offsetWidth;
  let percent = parseFloat(fallbackSize);

  return (percent * parentSize / 100.0);
}

// TODO(kjb) How do we handle this for width? font-size only refers to font height, though we could
// make a rough estimate of width based on some general-case constant.
function getEmSize(element, fallbackSize) {
  const fontSizeElement = fallbackSize.indexOf('rem') !== -1 ? document.documentElement : element;
  const fontSize = window.getComputedStyle(fontSizeElement).getPropertyValue('font-size');

  return (parseFloat(fallbackSize) * parseFloat(fontSize));
}
