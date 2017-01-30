import { assert, debugOnError } from '../../-debug/helpers';

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
        defaultValue = defaultValue * 2;
        layer.fill(defaultValue);

        left = prevLayer[(length - 1) * 2] || 0;
        right = prevLayer[((length - 1) * 2) + 1] || 0;

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

    totalAfter = total - totalBefore;

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
