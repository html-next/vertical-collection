export default function insertRangeBefore(element, firstNode, lastNode) {
  const { parentElement } = element;
  let nextNode;

  while (firstNode) {
    nextNode = firstNode.nextSibling;
    parentElement.insertBefore(firstNode, element);

    if (firstNode === lastNode) {
      break;
    }

    firstNode = nextNode;
  }
}
