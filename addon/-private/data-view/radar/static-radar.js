import { DEBUG } from '@glimmer/env';

import Radar from './radar';

export default class StaticRadar extends Radar {
  constructor(parentToken, options) {
    super(parentToken, options);

    this._firstItemIndex = 0;
    this._lastItemIndex = 0;

    if (DEBUG) {
      Object.preventExtensions(this);
    }
  }

  _updateIndexes() {
    const {
      bufferSize,
      totalItems,
      visibleMiddle,
      _calculatedEstimateHeight,
      _calculatedScrollContainerHeight
    } = this;

    if (totalItems === 0) {
      this._firstItemIndex = 0;
      this._lastItemIndex = -1;

      return;
    }

    const maxIndex = totalItems - 1;

    const middleItemIndex = Math.floor(visibleMiddle / _calculatedEstimateHeight);

    const shouldRenderCount = Math.min(Math.ceil(_calculatedScrollContainerHeight / _calculatedEstimateHeight), totalItems);

    let firstItemIndex = middleItemIndex - Math.floor(shouldRenderCount / 2);
    let lastItemIndex = middleItemIndex + Math.ceil(shouldRenderCount / 2) - 1;

    if (firstItemIndex < 0) {
      firstItemIndex = 0;
      lastItemIndex = shouldRenderCount - 1;
    }

    if (lastItemIndex > maxIndex) {
      lastItemIndex = maxIndex;
      firstItemIndex = maxIndex - (shouldRenderCount - 1);
    }

    firstItemIndex = Math.max(firstItemIndex - bufferSize, 0);
    lastItemIndex = Math.min(lastItemIndex + bufferSize, maxIndex);

    this._firstItemIndex = firstItemIndex;
    this._lastItemIndex = lastItemIndex;
  }

  _didEarthquake(scrollDiff) {
    return scrollDiff > (this._calculatedEstimateHeight / 2);
  }

  get total() {
    return this.totalItems * this._calculatedEstimateHeight;
  }

  get totalBefore() {
    return this.firstItemIndex * this._calculatedEstimateHeight;
  }

  get totalAfter() {
    return this.total - ((this.lastItemIndex + 1) * this._calculatedEstimateHeight);
  }

  get firstItemIndex() {
    return this._firstItemIndex;
  }

  get lastItemIndex() {
    return this._lastItemIndex;
  }

  get firstVisibleIndex() {
    return Math.ceil(this.visibleTop / this._calculatedEstimateHeight);
  }

  get lastVisibleIndex() {
    return Math.min(Math.ceil(this.visibleBottom / this._calculatedEstimateHeight), this.totalItems) - 1;
  }

  /*
   * Public API to query for the offset of an item
   */
  getOffsetForIndex(index) {
    return index * this._calculatedEstimateHeight + 1;
  }
}
