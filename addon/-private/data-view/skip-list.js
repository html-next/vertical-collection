import { assert, debugOnError } from '../../-debug/helpers';

export default class SkipList {
  constructor(initial, defaultValue) {
    this.layers = [];

    if (typeof initial === 'number') {
      this._initializeFromLength(initial, defaultValue);
    } else {
      this._initializeFromData(initial);
    }
  }

  _initializeFromLength(length, defaultValue) {
    let buffer, layer, prevLayer, left, right;

    this.total = defaultValue * length;

    while (length > 1) {
      buffer = new ArrayBuffer(length * 4);
      layer = new Uint32Array(buffer);
      layer.fill(defaultValue);

      if (prevLayer) {
        left = prevLayer[length * 2] || 0;
        right = prevLayer[(length * 2) + 1] || 0;

        layer[length - 1] = left + right;
      }

      this.layers.unshift(layer);

      length = Math.ceil(length / 2);
      defaultValue = defaultValue * 2;
    }

    this.values = this.layers[this.layers.length - 1];
  }

  _initializeFromData(data) {
    assert('Must initialize from UInt32Array', data instanceof Uint32Array);

    let i, length, buffer, layer, prevLayer, left, right;

    layer = data;
    length = data.length;

    while (length > 1) {
      this.layers.unshift(layer);
      prevLayer = layer;

      length = Math.ceil(length / 2);

      buffer = new ArrayBuffer(length * 4);
      layer = new Uint32Array(buffer);

      if (prevLayer) {
        for (i = 0; i < length; i++) {
          left = prevLayer[i * 2];
          right = prevLayer[(i * 2) + 1];
          layer[i] = right ? left + right : left;
        }
      }
    }

    this.total = this.layers[0][0] + this.layers[0][1];
    this.values = this.layers[this.layers.length - 1];
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
