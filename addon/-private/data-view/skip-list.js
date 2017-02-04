import { assert, debugOnError } from 'vertical-collection/-debug/helpers';

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
 * O(log n). The space complexity is O(n log n) in bytes (using Uint16/32Arrays helps a lot
 * here), and the initialization time is O(n log n).
 *
 * It works by constructing layer arrays, each of which is setup such that
 * `layer[i] = prevLayer[i * 2] + prevLayer[(i * 2) + 1]`. This allows us to traverse the layers
 * downward using a binary search to arrive at the index we want. We also add the values up as we
 * traverse to get the total value before and after the final index.
 */

export default class SkipList {
  constructor(values, defaultValue) {
    const layers = [values];
    let i, length, buffer, layer, prevLayer, left, right;

    prevLayer = values;
    length = values.length;

    while (length > 2) {
      length = Math.ceil(length / 2);

      buffer = new ArrayBuffer(length * 4);
      layer = new Uint32Array(buffer);

      if (defaultValue) {
        // If given a default value we assume that we can fill each
        // layer of the skip list with the previous layer's value * 2.
        // This allows us to use the `fill` method on Typed arrays, which
        // an order of magnitude faster than manually calculating each value.
        defaultValue = defaultValue * 2;
        layer.fill(defaultValue);

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

    this.total = layers[0][0] + layers[0][1];
    this.layers = layers;
    this.values = values;
  }

  get(targetValue) {
    const { layers, total } = this;
    const numLayers = layers.length;

    let i, layer, left, leftIndex, rightIndex;
    let index = 0;
    let totalBefore = 0;
    let totalAfter = 0;

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

    totalAfter = total - totalBefore - this.values[index];

    debugOnError('index must be within bounds', index >= 0 && index < this.values.length);

    return { index, totalBefore, totalAfter };
  }

  set(index, value) {
    const { layers } = this;
    const oldValue = layers[layers.length - 1][index];
    const delta = value - oldValue;

    if (delta === 0) {
      return;
    }

    let i, layer;

    for (i = layers.length - 1; i >= 0; i--) {
      layer = layers[i];

      layer[index] += delta;

      index = Math.floor(index / 2);
    }

    this.total += delta;
  }
}
