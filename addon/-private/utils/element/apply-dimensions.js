// TODO is this util used
export default function applyDimensions(element, dimensions) {
  for (const i in dimensions.style) {
    // TODO add explicit test
    if (dimensions.style.hasOwnProperty(i)) {
      element.style[i] = i === 'boxSizing' ? dimensions.style[i] : `${dimensions.style[i]}px`;
    }
  }
}
