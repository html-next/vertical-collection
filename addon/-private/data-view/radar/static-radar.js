import { default as Radar, NULL_INDEX } from './radar';
import { stripInProduction } from 'vertical-collection/-debug/helpers';

export default class StaticRadar extends Radar {
  constructor(parentToken, initialItems, initialRenderCount, startingIndex) {
    super(parentToken, initialItems, initialRenderCount, startingIndex);

    this._firstItemIndex = NULL_INDEX;
    this._lastItemIndex = NULL_INDEX;

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
      this._firstItemIndex = NULL_INDEX;
      this._lastItemIndex = NULL_INDEX;

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
    const firstVisibleIndex = Math.ceil(this.visibleTop / this._estimateHeight);

    return this.firstItemIndex === NULL_INDEX ? NULL_INDEX : firstVisibleIndex;
  }

  get lastVisibleIndex() {
    const lastVisibleIndex = Math.min(Math.ceil(this.visibleBottom / this._estimateHeight), this.totalItems) - 1;

    return this.firstItemIndex === NULL_INDEX ? NULL_INDEX : lastVisibleIndex;
  }
}
