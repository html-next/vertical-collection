export default function insertRangeBefore(
  parent: Node,
  element: Node | null,
  firstNode: Node | null,
  lastNode: Node | null,
): void {
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
