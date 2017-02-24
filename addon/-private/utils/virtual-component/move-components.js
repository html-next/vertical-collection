// VirtualComponent DOM is extracted by using a Range that begins at the first component to be
// moved and ends at the last. Glimmer's bindings allow us to extract the contents and move them,
// even before they are rendered.
export default function moveComponents(element, firstComponent, lastComponent, prepend) {
  const rangeToMove = new Range();

  rangeToMove.setStart(firstComponent._upperBound, 0);
  rangeToMove.setEnd(lastComponent._lowerBound, 0);

  const docFragment = rangeToMove.extractContents();

  // The first and last nodes in the range do not get extracted, and are instead cloned, so they
  // have to be reset.
  //
  // NOTE: Ember 1.11 - there are cases where docFragment is null (they haven't been rendered yet.)
  firstComponent._upperBound = docFragment.firstChild || firstComponent._upperBound;
  lastComponent._lowerBound = docFragment.lastChild || lastComponent._lowerBound;

  if (prepend) {
    element.prepend(docFragment);
  } else {
    element.appendChild(docFragment);
  }
}
