import Radar from './index';

export default class StaticRadar extends Radar {
  constructor(options) {
    super(options);
  }

  _update() {
    const totalIndexes = this.itemElements.length;
    const maxIndex = this.totalItems - 1;

    const middleVisibleValue = this.visibleTop + (this.scrollContainerHeight  / 2);
    const middleItemIndex = Math.ceil(middleVisibleValue / this.minValue);

    let firstItemIndex = middleItemIndex - Math.floor((totalIndexes - 1) / 2);
    let lastItemIndex = middleItemIndex + Math.ceil((totalIndexes - 1) / 2);

    if (firstItemIndex < 0) {
      firstItemIndex = 0;
      lastItemIndex = totalIndexes - 1;
    }

    if (lastItemIndex > maxIndex) {
      lastItemIndex = maxIndex;
      firstItemIndex = maxIndex - (totalIndexes - 1);
    }

    this._firstItemIndex = firstItemIndex;
    this._lastItemIndex = lastItemIndex;
  }

  get total() {
    return this.totalItems * this.minValue;
  }

  get totalBefore() {
    return this.firstItemIndex * this.minValue;
  }

  get totalAfter() {
    return this.total - (this.lastItemIndex * this.minValue);
  }

  get firstItemIndex() {
    return this._firstItemIndex;
  }

  get lastItemIndex() {
    return this._lastItemIndex;
  }

  get firstVisibleIndex() {
    return Math.ceil(this.visibleTop / this.minValue);
  }

  get lastVisibleIndex() {
    return Math.ceil(this.visibleBottom / this.minValue);
  }
}
