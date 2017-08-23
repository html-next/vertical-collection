import RedBlackTree from './red-black-tree';
import roundTo from '../utils/round-to';

export default class RbTreeWrapper {
  constructor(length, defaultValue) {
    this.defaultValue = defaultValue;
    this._createTree(length);
  }

  find(targetValue) {
    let ret = this.tree.findMaxIndex(targetValue);;
    if (ret.index !== 0 && ret.index < this.length - 1) {
      ret = this.tree.getTriple(ret.index + 1);
    }
    return ret;
  }

  getOffset(targetIndex) {
    // TODO(Billy): Figure out what offset function in the skip list does.
    throw new Error('Unsupported function');
  }

  set(index, value) {
    const oldValue = this.tree.getValueAtIndex(index);
    this.tree.update(index, value);

    return roundTo(value - oldValue);
  }

  getValues(index) {
    return this.tree.getValueAtIndex(index);
  }

  prepend(numPrepended) {
    if (numPrepended === 0) {
      return;
    }

    this.tree.prepend(numPrepended, this.defaultValue);
  }

  append(numAppended) {
    if (numAppended === 0) {
      return;
    }

    this.tree.append(numAppended, this.defaultValue);
  }

  reset(newLength) {
    this._createTree(newLength);
  }

  _createTree(length) {
    this.length = length;

    this.tree = new RedBlackTree();
    this.tree.add({
      start: 0,
      end: length - 1,
      value: this.defaultValue
    });
  }
}
