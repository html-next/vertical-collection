import { assert } from '@ember/debug';
import { DEBUG } from '@glimmer/env';

import roundTo from './utils/round-to';

/*
 * `SkipList` is a data structure designed with two main uses in mind:
 *
 * - Given a target value, find the index i in the list such that
 * `sum(list[0]..list[i]) <= value < sum(list[0]..list[i + 1])`
 *
 * - Given the index i (the fulcrum point) from above, get `sum(list[0]..list[i])`
 *   and `sum(list[i + 1]..list[-1])`
 *
 * The idea is that given a list of arbitrary heights or widths in pixels, we want to find
 * the index of the item such that when all of the items before it are added together, it will
 * be as close to the target (scrollTop of our container) as possible.
 *
 * This data structure acts somewhat like a Binary Search Tree. Given a list of size n, the
 * retreival time for the index is O(log n) and the update time should any values change is
 * O(log n). The space complexity is O(n log n) in bytes (using Float32Arrays helps a lot
 * here), and the initialization time is O(n log n).
 *
 * It works by constructing layer arrays, each of which is setup such that
 * `layer[i] = prevLayer[i * 2] + prevLayer[(i * 2) + 1]`. This allows us to traverse the layers
 * downward using a binary search to arrive at the index we want. We also add the values up as we
 * traverse to get the total value before and after the final index.
 */

function fill(array, value, start = 0, end = array.length) {
  if (typeof array.fill === 'function') {
    array.fill(value, start, end);
  } else {
    for (; start < end; start++) {
      array[start] = value;
    }

    return array;
  }
}

function subarray(array, start, end) {
  if (typeof array.subarray === 'function') {
    return array.subarray(start, end);
  } else {
    return array.slice(start, end);
  }
}

export default class SkipList {
  constructor(length, defaultValue) {
    const values = new Float32Array(new ArrayBuffer(length * 4));
    fill(values, defaultValue);

    this.length = length;
    this.defaultValue = defaultValue;

    this._initializeLayers(values, defaultValue);

    if (DEBUG) {
      Object.preventExtensions(this);
    }
  }

  _initializeLayers(values, defaultValue) {
    const layers = [values];
    let i, length, layer, prevLayer, left, right;

    prevLayer = layer = values;
    length = values.length;

    while (length > 2) {
      length = Math.ceil(length / 2);

      layer = new Float32Array(new ArrayBuffer(length * 4));

      if (defaultValue !== undefined) {
        // If given a default value we assume that we can fill each
        // layer of the skip list with the previous layer's value * 2.
        // This allows us to use the `fill` method on Typed arrays, which
        // an order of magnitude faster than manually calculating each value.
        defaultValue = defaultValue * 2;
        fill(layer, defaultValue);

        left = prevLayer[(length - 1) * 2] || 0;
        right = prevLayer[((length - 1) * 2) + 1] || 0;

        // Layers are not powers of 2, and sometimes they may by odd sizes.
        // Only the last value of a layer will be different, so we calculate
        // its value manually.
        layer[length - 1] = left + right;
      } else {
        for (i = 0; i < length; i++) {
          left = prevLayer[i * 2];
          right = prevLayer[(i * 2) + 1];
          layer[i] = right ? left + right : left;
        }
      }

      layers.unshift(layer);
      prevLayer = layer;
    }

    this.total = layer.length > 0 ? layer.length > 1 ? layer[0] + layer[1] : layer[0] : 0;

    assert('total must be a number', typeof this.total === 'number');

    this.layers = layers;
    this.values = values;
  }

  find(targetValue) {
    const { layers, total, length, values } = this;
    const numLayers = layers.length;

    if (length === 0) {
      return { index: 0, totalBefore: 0, totalAfter: 0 };
    }

    let i, layer, left, leftIndex, rightIndex;
    let index = 0;
    let totalBefore = 0;
    let totalAfter = 0;

    targetValue = Math.min(total - 1, targetValue);

    assert('targetValue must be a number', typeof targetValue === 'number');
    assert('targetValue must be greater than or equal to 0', targetValue >= 0);
    assert('targetValue must be no more than total', targetValue < total);

    for (i = 0; i < numLayers; i++) {
      layer = layers[i];

      leftIndex = index;
      rightIndex = index + 1;

      left = layer[leftIndex];

      if (targetValue >= totalBefore + left) {
        totalBefore = totalBefore + left;
        index = rightIndex * 2;
      } else {
        index = leftIndex * 2;
      }
    }

    index = index / 2;

    assert('index must be a number', typeof index === 'number');
    assert('index must be within bounds', index >= 0 && index < this.values.length);

    totalAfter = total - (totalBefore + values[index]);

    return { index, totalBefore, totalAfter };
  }

  getOffset(targetIndex) {
    const { layers, length, values } = this;
    const numLayers = layers.length;

    if (length === 0) {
      return 0;
    }

    let index = 0;
    let offset = 0;

    for (let i = 0; i < numLayers - 1; i++) {
      const layer = layers[i];

      const leftIndex = index;
      const rightIndex = index + 1;

      if (targetIndex >= rightIndex * Math.pow(2, numLayers - i - 1)) {
        offset = offset + layer[leftIndex];
        index = rightIndex * 2;
      } else {
        index = leftIndex * 2;
      }
    }

    if (index + 1 === targetIndex) {
      offset += values[index];
    }

    return offset;
  }

  set(index, value) {
    assert('value must be a number', typeof value === 'number');
    assert('value must non-negative', value >= 0);
    assert('index must be a number', typeof index === 'number');
    assert('index must be within bounds', index >= 0 && index < this.values.length);

    const { layers } = this;
    const oldValue = layers[layers.length - 1][index];
    const delta = roundTo(value - oldValue);

    if (delta === 0) {
      return delta;
    }

    let i, layer;

    for (i = layers.length - 1; i >= 0; i--) {
      layer = layers[i];

      layer[index] += delta;

      index = Math.floor(index / 2);
    }

    this.total += delta;

    return delta;
  }

  prepend(numPrepended) {
    const {
      values: oldValues,
      length: oldLength,
      defaultValue
    } = this;

    const newLength = numPrepended + oldLength;

    const newValues = new Float32Array(new ArrayBuffer(newLength * 4));

    newValues.set(oldValues, numPrepended);
    fill(newValues, defaultValue, 0, numPrepended);

    this.length = newLength;
    this._initializeLayers(newValues);
  }

  append(numAppended) {
    const {
      values: oldValues,
      length: oldLength,
      defaultValue
    } = this;

    const newLength = numAppended + oldLength;

    const newValues = new Float32Array(new ArrayBuffer(newLength * 4));

    newValues.set(oldValues);
    fill(newValues, defaultValue, oldLength);

    this.length = newLength;
    this._initializeLayers(newValues);
  }

  reset(newLength) {
    const {
      values: oldValues,
      length: oldLength,
      defaultValue
    } = this;

    if (oldLength === newLength) {
      return;
    }

    const newValues = new Float32Array(new ArrayBuffer(newLength * 4));

    if (oldLength < newLength) {
      newValues.set(oldValues);
      fill(newValues, defaultValue, oldLength);
    } else {
      newValues.set(subarray(oldValues, 0, newLength));
    }

    this.length = newLength;

    if (oldLength === 0) {
      this._initializeLayers(newValues, defaultValue);
    } else {
      this._initializeLayers(newValues);
    }
  }
}
