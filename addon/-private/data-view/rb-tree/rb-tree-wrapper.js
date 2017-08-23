import RedBlackTree from './red-black-tree';

export default class RbTreeWrapper {
  constructor(length, defaultValue) {
    this.defaultValue = defaultValue;
    this._createTree(length);
  }

  find(targetValue) {
    return this.tree.findMaxIndex(targetValue);
  }

  getOffset(targetIndex) {
    // TODO(Billy): Figure out what offset function in the skip list does.
    throw new Error('Unsupported function');
  }

  set(index, value) {
    this.tree.update(index, value);
  }

  prepend(numPrepended) {
    if (numPrepended === 0) {
      return;
    }

    const oldSmallestIndex = this.smallesIndex;
    tree.add({
      start: oldSmallestIndex - numPrepended,
      end: oldSmallestIndex - 1,
      value: this.defaultValue
    });
    thils.smallesIndex = oldSmallestIndex - numPrepended;
  }

  append(numAppended) {
    if (numAppended === 0) {
      return;
    }

    const oldBiggestIndex = this.biggestIndex;
    tree.add({
      start: oldBiggestIndex + numAppended,
      end: oldBiggestIndex + 1,
      value: this.defaultValue
    });
    this.biggestIndex = oldBiggestIndex + numAppended;
  }

  reset(newLength) {
    this._createTree(newLength);
  }

  _createTree(length) {
    this.length = length;
    this.smallesIndex = 0;
    this.biggestIndex = length - 1;

    this.tree = new RedBlackTree();
    tree.add({
      start: 0,
      end: length - 1,
      value: this.defaultValue
    });
  }
}
