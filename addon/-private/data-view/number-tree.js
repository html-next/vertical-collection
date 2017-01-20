export default class {
  constructor(length, defaultValue) {
    let buffer, layer, prevLayer, left, right;

    this.layers = [];
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

  getIndex(target) {
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

      if (target >= totalBefore + left) {
        totalBefore = totalBefore + left;
        index = rightIndex * 2;
      } else {
        index = leftIndex * 2;
      }
    }

    index = index / 2;

    totalAfter = total - totalBefore;

    return { index, totalBefore, totalAfter };
  }

  setIndex(index, value) {
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
