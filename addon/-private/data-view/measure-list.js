import { assert, debugOnError } from 'vertical-collection/-debug/helpers';

import SkipList from './skip-list';

export default class MeasureList {
  constructor(length, defaultValue) {
    const scalars = new Uint16Array(new ArrayBuffer(length * 2));
    const margins = new Uint16Array(new ArrayBuffer(length * 2));

    scalars.fill(defaultValue);

    this.skipList = new SkipList(scalars.slice(), defaultValue);

    this.scalars = scalars;
    this.margins = margins;

    this.length = length;
    this.defaultValue = defaultValue;
  }

  find(targetValue) {
    return this.skipList.find(targetValue);
  }

  set(index, scalar, margin) {
    this.scalars[index] = scalar;
    this.margins[index] = margin;

    return this.skipList.set(index, scalar + margin);
  }

  get values() {
    return this.skipList.values;
  }

  get total() {
    return this.skipList.total;
  }

  prepend(numPrepended) {
    const {
      scalars: oldScalars,
      margins: oldMargins,
      values: oldValues,
      length: oldLength,
      defaultValue
    } = this;

    const newLength = numPrepended + oldLength;

    const newScalars = new Uint16Array(new ArrayBuffer(newLength * 2));
    const newValues = new Uint16Array(new ArrayBuffer(newLength * 2));
    const newMargins = new Uint16Array(new ArrayBuffer(newLength * 2));

    newScalars.set(oldScalars, numPrepended);
    newScalars.fill(defaultValue, 0, numPrepended);

    newValues.set(oldValues, numPrepended);
    newValues.fill(defaultValue, 0, numPrepended);

    newMargins.set(oldMargins, numPrepended);

    this.scalars = newScalars;
    this.margins = newMargins;
    this.skipList = new SkipList(newValues);
    this.length = newLength;
  }

  append(numAppended) {
    const {
      scalars: oldScalars,
      margins: oldMargins,
      values: oldValues,
      length: oldLength,
      defaultValue
    } = this;

    const newLength = numAppended + oldLength;

    const newScalars = new Uint16Array(new ArrayBuffer(newLength * 2));
    const newValues = new Uint16Array(new ArrayBuffer(newLength * 2));
    const newMargins = new Uint16Array(new ArrayBuffer(newLength * 2));

    newScalars.set(oldScalars);
    newScalars.fill(defaultValue, oldLength);

    newValues.set(oldValues);
    newValues.fill(defaultValue, oldLength);

    newMargins.set(oldMargins);

    this.scalars = newScalars;
    this.margins = newMargins;
    this.skipList = new SkipList(newValues);
    this.length = newLength;
  }
}
