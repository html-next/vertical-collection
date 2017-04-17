export default function moveRange(destinationElement, firstNode, lastNode, prepend) {
  let node = firstNode;
  let nextNode = node.nextSibling;
  let previousNode = destinationElement.firstChild;

  while (node) {
    destinationElement.insertBefore(node, prepend ? previousNode.nextSibling : null);

    if (node === lastNode) {
      break;
    }

    previousNode = node;
    node = nextNode;
    nextNode = node.nextSibling;
  }
}
