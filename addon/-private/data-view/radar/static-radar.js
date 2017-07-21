import Radar from './radar';
import { stripInProduction } from 'vertical-collection/-debug/helpers';

export default class StaticRadar extends Radar {
  constructor(parentToken, initialItems, initialRenderCount, startingIndex, shouldRecycle) {
    super(parentToken, initialItems, initialRenderCount, startingIndex, shouldRecycle);

    this._firstItemIndex = 0;
    this._lastItemIndex = 0;

    stripInProduction(() => {
      Object.preventExtensions(this);
    });
  }

  _updateIndexes() {
    const {
      bufferSize,
      totalItems,
      visibleTop,
      visibleBottom,
      _estimateHeight
    } = this;

    if (totalItems === 0) {
      this._firstItemIndex = 0;
      this._lastItemIndex = -1;

      return;
    }

    const maxIndex = totalItems - 1;

    let firstItemIndex = Math.floor(visibleTop / _estimateHeight);
    firstItemIndex = Math.max(0, firstItemIndex - bufferSize);

    let lastItemIndex = Math.ceil(visibleBottom / _estimateHeight) - 1;
    lastItemIndex = Math.min(maxIndex, lastItemIndex + bufferSize);

    this._firstItemIndex = firstItemIndex;
    this._lastItemIndex = lastItemIndex;
  }

  get total() {
    return this.totalItems * this._estimateHeight;
  }

  get totalBefore() {
    return this.firstItemIndex * this._estimateHeight;
  }

  get totalAfter() {
    return this.total - ((this.lastItemIndex + 1) * this._estimateHeight);
  }

  get firstItemIndex() {
    return this._firstItemIndex;
  }

  get lastItemIndex() {
    return this._lastItemIndex;
  }

  get firstVisibleIndex() {
    return Math.ceil(this.visibleTop / this._estimateHeight);
  }

  get lastVisibleIndex() {
    return Math.min(Math.ceil(this.visibleBottom / this._estimateHeight), this.totalItems) - 1;
  }
}
