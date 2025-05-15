export default function insertRangeBefore(parent, element, firstNode, lastNode) {
  let nextNode;

  while (firstNode) {
    nextNode = firstNode.nextSibling;
    parent.insertBefore(firstNode, element);

    if (firstNode === lastNode) {
      break;
    }

    firstNode = nextNode;
  }
}
