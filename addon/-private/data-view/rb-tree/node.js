export const COLOR_BLACK = 1;
export const COLOR_RED = 2;

export class Node {
  constructor(data) {
    this.data = data;
    this.data.leftSum = this.getTotalIntervalValue();

    this.color = COLOR_BLACK;

    this.left = null;
    this.right = null;
    this.parent = null;
  }

  printNode(depth) {
    const color = this.color === COLOR_BLACK ? 'B' : 'R';
    console.log(' '.repeat(2 * depth) + '[' + this.data.start + ', ' + this.data.end + '] ' + this.data.value + color);
    if (this.left !== null) {
      this.left.printNode(depth + 1);
    }
    if (this.right !== null) {
      this.right.printNode(depth + 1);
    }
  }

  getData() {
    return this.data;
  }

  getLeft() {
    return this.left;
  }

  getRight() {
    return this.right;
  }

  setLeft(childNode) {
    let delta = 0;
    if (this.left != null) {
      // Subtract old sum
      delta -= this.left.getTotalSum();
      this.left.parent = null;
    }

    if (childNode != null) {
      childNode.removeFromParent();
      childNode.parent = this;
      delta += childNode.getTotalSum();
    }
    this.left = childNode;

    if (delta != 0) {
      this.updateSum(delta, true);
    }
  }

  setRight(childNode) {
    let delta = 0;
    // Break old links, then reconnect properly.
    if (this.right != null) {
      delta -= this.right.getTotalSum();
      this.right.parent = null;
    }
    if (childNode != null) {
      childNode.removeFromParent();
      childNode.parent = this;
      delta += childNode.getTotalSum();
    }
    this.right = childNode;

    if (delta != 0) {
      this.updateSum(delta, false);
    }
  }

  updateSum(delta, updateCurrentNode) {
    let node = this;
    let shouldUpdate = updateCurrentNode;

    while (node != null) {
      if (shouldUpdate) {
        node.data.leftSum += delta;
      }
      const parent = node.parent;
      if (parent === null) {
        break;
      }
      if (node === parent.getLeft()) {
        // node is a left child of parent, continue going up.
        shouldUpdate = true;
      } else {
        shouldUpdate = false;
      }
      node = parent;
    }
  }

  getParent() {
    return this.parent;
  }

  getIntervalLength() {
    return this.data.end - this.data.start + 1;
  }

  getTotalIntervalValue() {
    return (this.data.end - this.data.start + 1) * this.data.value;
  }

  setData(data, forceUpdate) {
    if (forceUpdate) {
      const delta = data.leftSum - this.data.leftSum;
      this.updateSum(delta, true);

      this.data = data;
      return;
    }

    const delta = (data.value - this.data.value) * this.getIntervalLength();
    const newSum = this.data.leftSum + delta;
    this.updateSum(delta, true);

    this.data = {
      start: data.start,
      end: data.end,
      value: data.value,
      sum: newSum
    }
  }

  getLeftSum() {
    return this.data.leftSum;
  }

  getStrictLeftSum() {
    return this.data.leftSum - this.getTotalIntervalValue();
  }

  /**
   * Gets value of the left most leaf of this tree.
   */
  getLeftMostValue() {
    let value;
    let node = this;
    while (node !== null) {
      value = node.data.value;
      node = node.left;
    }
    return value;
  }

  getTotalSum() {
    let node = this;
    let sum = 0;
    while (node !== null) {
      sum += node.data.leftSum;
      node = node.right;
    }
    return sum;
  }

  removeFromParent() {
    const parent = this.parent;
    if (parent !== null) {
      if (this === parent.getLeft()) {
        parent.setLeft(null);

      } else if (this === parent.getRight()) {
        parent.setRight(null);
      } else {
        throw new Error("Invalid state.");
      }
    }
  }

  getColorString() {
    return this.color === COLOR_BLACK ? 'B' : 'R';
  }

  getDebugObject() {
    const obj = {};
    obj.data = this.data.value + this.getColorString();
    if (this.left === null) {
      obj.left = "";
    } else {
      obj.left = this.left.getDebugObject();
    }

    if (this.right === null) {
      obj.right = "";
    } else {
      obj.right = this.right.getDebugObject();
    }

    return obj;
  }

  debugSum() {
    let sum = this.getTotalIntervalValue();
    if (this.left !== null) {
      sum += this.left.debugSum();
    }
    if (this.data.leftSum !== sum) {
      this.printNode(0);
      throw new Error('Sum does not match: ' + this.data.start + ' ' + this.data.leftSum + ' ' + sum);
    }

    let rightSum = 0;
    if (this.right !== null) {
      rightSum = this.right.debugSum();
    }
    return sum + rightSum;
  }
}
