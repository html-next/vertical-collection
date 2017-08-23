import { Node, COLOR_BLACK, COLOR_RED } from './node';
import { assert } from 'vertical-collection/-debug/helpers';

export default class RedBlackTree {
  constructor() {
    this.root = null;
    this.minIndex = 0;
    this.maxIndex = 0;
  }

  printTree() {
    if (this.root !== null) {
      this.root.printNode(0);
    }
  }

  add(data) {
    if (this.root == null) {
      this.root = new Node(data);
      return;
    }

    let n = this.root;
    while (n !== null) {
      const comparisonResult = this.compareNode(data, n.getData());
      if (comparisonResult == 0) {
        n.setData(data);
        return;
      } else if (comparisonResult < 0) {
        if (n.getLeft() == null) {
          n.setLeft(new Node(data));
          this.adjustAfterInsertion(n.getLeft());
          break;
        }
        n = n.getLeft();
      } else { // comparisonResult > 0
        if (n.getRight() == null) {
          n.setRight(new Node(data));
          this.adjustAfterInsertion(n.getRight());
          break;
        }
        n = n.getRight();
      }
    }

    this.debugSum();
  }

  remove(data) {
    let node = this.nodeContaining(data);
    if (node == null) {
      // No such object, do nothing.
      return;
    }

    if (node.getLeft() != null && node.getRight() != null) {
        // Node has two children, Copy predecessor data in.
        const predecessor = this.predecessor(node);
        node.setData(predecessor.getData());
        this.debugSum();
        node = predecessor;
    }

    this.debugSum();

    // At this point node has zero or one child
    const pullUp = this.leftOf(node) == null ? this.rightOf(node) : this.leftOf(node);
    if (pullUp != null) {
      // Splice out node, and adjust if pullUp is a double black.
      if (node == this.root) {
        this.setRoot(pullUp);
      } else if (node.getParent().getLeft() == node) {
        node.getParent().setLeft(pullUp);
      } else {
        node.getParent().setRight(pullUp);
      }

      if (this.isBlack(node)) {
        this.adjustAfterRemoval(pullUp);
      }
    } else if (node == this.root) {
      // Nothing to pull up when deleting a this.root means we emptied the tree
      this.setRoot(null);
    } else {
      // The node being deleted acts as a double black sentinel
      if (this.isBlack(node)) {
          this.adjustAfterRemoval(node);
      }
      node.removeFromParent();
    }

    if (this.root !== null) {
      this.debugSum();
    }
  }

  adjustAfterInsertion(n) {
    // Step 1: color the node red
    this.setColor(n, COLOR_RED);

    // Step 2: Correct double red problems, if they exist
    if (n != null && n != this.root && this.isRed(this.parentOf(n))) {

      // Step 2a (simplest): Recolor, and move up to see if more work
      // needed
      if (this.isRed(this.siblingOf(this.parentOf(n)))) {
        this.setColor(this.parentOf(n), COLOR_BLACK);
        this.setColor(this.siblingOf(this.parentOf(n)), COLOR_BLACK);
        this.setColor(this.grandparentOf(n), COLOR_RED);
        this.adjustAfterInsertion(this.grandparentOf(n));
      }

      // Step 2b: Restructure for a parent who is the left child of the
      // grandparent. This will require a single right rotation if n is
      // also
      // a left child, or a left-right rotation otherwise.
      else if (this.parentOf(n) == this.leftOf(this.grandparentOf(n))) {
        if (n == this.rightOf(this.parentOf(n))) {
          n = this.parentOf(n);
          this.rotateLeft(n);
        }
        this.setColor(this.parentOf(n), COLOR_BLACK);
        this.setColor(this.grandparentOf(n), COLOR_RED);
        this.rotateRight(this.grandparentOf(n));
      }

      // Step 2c: Restructure for a parent who is the right child of the
      // grandparent. This will require a single left rotation if n is
      // also
      // a right child, or a right-left rotation otherwise.
      else if (this.parentOf(n) == this.rightOf(this.grandparentOf(n))) {
        if (n == this.leftOf(this.parentOf(n))) {
          this.rotateRight(n = this.parentOf(n));
        }
        this.setColor(this.parentOf(n), COLOR_BLACK);
        this.setColor(this.grandparentOf(n), COLOR_RED);
        this.rotateLeft(this.grandparentOf(n));
      }
    }

    // Step 3: Color the root black
    this.setColor(this.root, COLOR_BLACK);
  }

  adjustAfterRemoval(n) {
    while (n != this.root && this.isBlack(n)) {
      if (n == this.leftOf(this.parentOf(n))) {
        // Pulled up node is a left child
        let sibling = this.rightOf(this.parentOf(n));
        if (this.isRed(sibling)) {
          this.setColor(sibling, COLOR_BLACK);
          this.setColor(this.parentOf(n), COLOR_RED);
          this.rotateLeft(this.parentOf(n));
          sibling = this.rightOf(this.parentOf(n));
        }
        if (this.isBlack(this.leftOf(sibling)) && this.isBlack(this.rightOf(sibling))) {
          this.setColor(sibling, COLOR_RED);
          n = this.parentOf(n);
        } else {
          if (this.isBlack(this.rightOf(sibling))) {
            this.setColor(this.leftOf(sibling), COLOR_BLACK);
            this.setColor(sibling, COLOR_RED);
            this.rotateRight(sibling);
            sibling = this.rightOf(this.parentOf(n));
          }
          this.setColor(sibling, this.colorOf(this.parentOf(n)));
          this.setColor(this.parentOf(n), COLOR_BLACK);
          this.setColor(this.rightOf(sibling), COLOR_BLACK);
          this.rotateLeft(this.parentOf(n));
          n = this.root;
        }
      } else {
        // pulled up node is a right child
        let sibling = this.leftOf(this.parentOf(n));
        if (this.isRed(sibling)) {
          this.setColor(sibling, COLOR_BLACK);
          this.setColor(this.parentOf(n), COLOR_RED);
          this.rotateRight(this.parentOf(n));
          sibling = this.leftOf(this.parentOf(n));
        }
        if (this.isBlack(this.leftOf(sibling)) && this.isBlack(this.rightOf(sibling))) {
          this.setColor(sibling, COLOR_RED);
          n = this.parentOf(n);
        } else {
          if (this.isBlack(this.leftOf(sibling))) {
            this.setColor(this.rightOf(sibling), COLOR_BLACK);
            this.setColor(sibling, COLOR_RED);
            this.rotateLeft(sibling);
            sibling = this.leftOf(this.parentOf(n));
          }
          this.setColor(sibling, this.colorOf(this.parentOf(n)));
          this.setColor(this.parentOf(n), COLOR_BLACK);
          this.setColor(this.leftOf(sibling), COLOR_BLACK);
          this.rotateRight(this.parentOf(n));
          n = this.root;
        }
      }
    }
    this.setColor(n, COLOR_BLACK);
  }

  colorOf(n) {
    return n == null ? COLOR_BLACK : n.color;
  }

  isRed(n) {
      return n != null && this.colorOf(n) == COLOR_RED;
  }

  isBlack(n) {
      return n == null || this.colorOf(n) == COLOR_BLACK;
  }

  setColor(n, c) {
    if (n != null) {
      n.color = c;
    }
  }

  parentOf(n) {
    return n == null ? null : n.getParent();
  }

  grandparentOf(n) {
    return (n == null || n.getParent() == null) ? null : n .getParent().getParent();
  }

  siblingOf(n) {
    return (n == null || n.getParent() == null) ? null : (n == n
            .getParent().getLeft()) ? n.getParent().getRight()
            : n.getParent().getLeft();
  }

  leftOf(n) {
      return n == null ? null : n.getLeft();
  }

  rightOf(n) {
      return n == null ? null : n.getRight();
  }

  nodeContaining(data) {
    let n = this.root;

    while (n !== null) {
      const comparisonResult = this.compareNode(data, n.getData());
      if (comparisonResult == 0) {
        return n;
      } else if (comparisonResult < 0) {
        n = n.getLeft();
      } else {
        n = n.getRight();
      }
    }

    return null;
  }

  setRoot(node) {
    if (node != null) {
      node.removeFromParent();
    }
    this.root = node;
  }

  rotateLeft(n) {
    if (n.getRight() == null) {
      return;
    }

    const oldRight = n.getRight();
    const oldRightLeft = oldRight.getLeft();

    if (oldRightLeft !== null) {
      oldRightLeft.removeFromParent();
    }

    this.debugSum();

    n.setRight(oldRightLeft);
    this.debugSum();

    if (n.getParent() == null) {
        this.root = oldRight;
    } else if (n.getParent().getLeft() == n) {
        n.getParent().setLeft(oldRight);
    } else {
        n.getParent().setRight(oldRight);
    }
    oldRight.setLeft(n);

    this.debugSum();
  }

  rotateRight(n) {
    if (n.getLeft() == null) {
      return;
    }

    const oldLeft = n.getLeft();
    const oldLeftRight = oldLeft.getRight(); // right child of the old left.
    if (oldLeftRight !== null) {
      oldLeftRight.removeFromParent();
    }

    n.setLeft(oldLeftRight);
    if (n.getParent() == null) {
        this.root = oldLeft;
    } else if (n.getParent().getLeft() == n) {
        n.getParent().setLeft(oldLeft);
    } else {
        n.getParent().setRight(oldLeft);
    }
    oldLeft.setRight(n);

    this.debugSum();
  }

  update(outsideIndex, value) {
    let index = this.minIndex + outsideIndex;
    const data = {
      start: index,
      end: index,
      value
    };

    const node = this._nodeContainingIndex(index);
    if (node === null) {
      throw new Error('Node cannot be found for ' + index + ' ' + value);
    }
    if (index < node.data.start || index > node.data.end) {
      throw new Error('Invalid node range ' + index + ' ' + start + ' ' + end);
    }
    if (value === node.data.value) {
      // Nothing to update
      return;
    }

    const { start, end } = node.getData();
    const sum = node.getLeftSum();
    const oldValue = node.getData().value;

    if (node.getIntervalLength() === 1) {
      node.setData({
        start: index,
        end: index,
        value: value,
        leftSum: node.getLeftSum() - node.getTotalIntervalValue() + (end - start + 1) * value
      }, true);
      return;
    }

    if (index > start && index < end) {
      // Update this node. This node has an interval of length 1 [index..index]. We create 2 new
      // interval of the left & right of the index and insert into the tree.
      node.setData({
        start: index,
        end: index,
        value: value,
        leftSum: sum - node.getTotalIntervalValue() + value
      }, true);

      // Create 2 new more nodes for this tree.
      this.add({
        start: start,
        end: index - 1,
        value: oldValue
      });

      this.add({
        start: index + 1,
        end: end,
        value: oldValue
      });
      return;
    }

    // Now index is either start or end of the interval.
    const start1 = start;
    const end2 = end;
    let value1 = oldValue;
    let value2 = oldValue;

    let end1, start2;
    if (index === start) {
      end1 = start;
      start2 = start + 1;
      value1 = value;
    } else { // index == end
      end1 = end - 1;
      start2 = end;
      value2 = value;
    }

    // Keep first interval.
    node.setData({
      start: start1,
      end: end1,
      value: value1,
      leftSum: sum - node.getTotalIntervalValue() + (end1 - start1 + 1) * value1
    }, true);

    // Insert second interval
    this.add({ start: start2, end: end2, value: value2 });

    this.debugSum();
  }

  _nodeContainingIndex(index) {
    let n = this.root;

    while (n !== null) {
      const nodeData = n.getData();
      if (nodeData.start <= index && nodeData.end >= index) {
        return n;
      }

      if (nodeData.end < index) {
        n = n.getRight();
      } else {
        n = n.getLeft();
      }
    }

    return null;
  }

  getSum(outsideIndex) {
    let index = this.minIndex + outsideIndex;
    return this._getSum(index);
  }

  _getSum(index) {
    let sum = 0;
    let n = this.root;

    const data = {
      start: index,
      end: index
    }

    while (n !== null) {
      const comparisonResult = this.compareNode(data, n.getData());
      if (comparisonResult == 0) {
        sum += n.getLeftSum();
        break;
      } else if (comparisonResult < 0) {
        const nodeData = n.getData();
        if (index >= nodeData.start) {
          sum += n.getStrictLeftSum() + (index - nodeData.start + 1) * nodeData.value;
          break;
        }
        n = n.getLeft();
      } else {
        sum += n.getLeftSum();
        n = n.getRight();
      }
    }

    return sum;
  }

  /**
   * Public function to get an index. This index is the outside index.
   */
  getValueAtIndex(outsideIndex) {
    return this._getValueAtIndex(this.minIndex + outsideIndex);
  }

  _getValueAtIndex(index) {
    return this._getDataAtIndex(index).value;
  }

  _getDataAtIndex(index) {
    let n = this.root;

    const data = {
      start: index,
      end: index
    }

    while (n !== null) {
      const nodeData = n.getData();
      const comparisonResult = this.compareNode(data, nodeData);
      if (comparisonResult == 0) {
        return nodeData;
      } else if (comparisonResult < 0) {
        if (index >= nodeData.start) {
          return nodeData;
        }
        n = n.getLeft();
      } else {
        n = n.getRight();
      }
    }
    return null;
  }

  getTriple(outsideIndex) {
    const index = this.minIndex + outsideIndex;
    const value = this._getValueAtIndex(index);
    const totalBefore = this._getSum(index) - value;
    const total = this.root.getTotalSum();
    const totalAfter = this.root.getTotalSum() - totalBefore - value;

    return { index: index - this.minIndex, totalBefore: totalBefore, totalAfter: totalAfter };
  }

  findMaxIndex(targetValue) {
    let n = this.root;
    if (n === null) {
      return {index: 0, totalBefore: 0, totalAfter: 0};
    }

    if (targetValue === 0) {
      return { index: 0, totalBefore: 0, totalAfter: this.root.getTotalSum() };
    }

    let remainingValue = targetValue;
    let totalBefore = 0;
    let valueAtIndex = 0;
    const MIN = -100000000;
    let index = MIN;

    const DIRECTION_STAY = 0;
    const DIRECTION_GO_LEFT = 1;
    const DIRECTION_GO_RIGHT = 2;

    while (n != null) {
      const nodeData = n.getData();
      const strictLeftSum = n.getStrictLeftSum();
      const leftSum = n.getLeftSum();

      let direction = -1;

      if (remainingValue >= leftSum) {
        if (n.getRight() !== null) {
          const minValue = n.getRight().getLeftMostValue();
          if (minValue > remainingValue - leftSum) {
            // Stay here.
            direction = DIRECTION_STAY;
          } else {
            direction = DIRECTION_GO_RIGHT;
          }
        } else {
          direction = DIRECTION_STAY;
        }
      } else if (remainingValue < strictLeftSum) {
        direction = DIRECTION_GO_LEFT;
      } else { // remainingValue >= strictLeftSum && remainingValue < leftSum
        if (remainingValue - strictLeftSum < nodeData.value) {
          direction = DIRECTION_GO_LEFT;
        } else {
          direction = DIRECTION_STAY;
        }
      }

      if (direction === DIRECTION_GO_LEFT) {
        n = n.getLeft();
      } else if (direction === DIRECTION_GO_RIGHT) {
        totalBefore += leftSum;
        remainingValue -= leftSum;
        n = n.getRight();
      } else {
        remainingValue -= strictLeftSum;
        totalBefore += strictLeftSum;
        valueAtIndex = nodeData.value;

        if (nodeData.value === 0) {
          index = nodeData.end;
        } else {
          if (remainingValue <= 2 * nodeData.value - 1) {
            // totalBefore remains the same.
            index = nodeData.start;
          } else {
            index = Math.floor((remainingValue - nodeData.value) / nodeData.value) + nodeData.start;
            assert('index should be bigger than start', index > nodeData.start);
            totalBefore += (index - nodeData.start) * nodeData.value;
          }
        }
        index = Math.min(index, nodeData.end);
        break;
      }
    }

    if (index === MIN) {
      index = this.minIndex;
      valueAtIndex = this._getValueAtIndex(index);
    }

    const totalAfter = this.root.getTotalSum() - totalBefore - valueAtIndex;
    return { index: index - this.minIndex, totalBefore: totalBefore, totalAfter: totalAfter };
  }

  prepend(itemCount, value) {
    this.minIndex -= itemCount;
    this.add({
      start: this.minIndex,
      end: this.minIndex + itemCount - 1,
      value: value
    });
  }

  append(itemCount, value) {
    if (this.root !== null) {
      const data = this.root.getRightMostData();
      this.maxIndex = data.end;
    }

    this.add({
      start: this.maxIndex + 1,
      end: this.maxIndex + itemCount,
      value: value
    });
  }

  debugSum() {
    if (this.root !== null) {
      this.root.debugSum();
    }
  }

  predecessor(node) {
    let n = node.getLeft();
    if (n != null) {
      while (n.getRight() != null) {
        n = n.getRight();
      }
    }
    return n;
  }

  compareNode(node1, node2) {
    if (node1.start === node2.start && node1.end === node2.end) {
      return 0;
    }

    if (node1.start >= node2.start && node1.end <= node2.end) {
      return -1;
    }

    return node1.start - node2.start;
  }
}
