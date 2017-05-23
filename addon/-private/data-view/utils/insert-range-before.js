export default function insertRangeBefore(element, firstNode, lastNode) {
  const { parentNode } = element;
  let nextNode;

  while (firstNode) {
    nextNode = firstNode.nextSibling;
    parentNode.insertBefore(firstNode, element);

    if (firstNode === lastNode) {
      break;
    }

    firstNode = nextNode;
  }
}
