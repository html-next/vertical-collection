import { default as Radar, NULL_INDEX } from './radar';

export default class StaticRadar extends Radar {
  constructor() {
    super();

    this._firstItemIndex = NULL_INDEX;
    this._lastItemIndex = NULL_INDEX;
  }

  _updateIndexes() {
    const totalIndexes = this.orderedComponents.length;
    const maxIndex = this.totalItems - 1;

    const middleVisibleValue = this.visibleTop + ((this.visibleBottom - this.visibleTop)  / 2);
    const middleItemIndex = Math.ceil(middleVisibleValue / this.minHeight);

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
    return this.totalItems * this.minHeight;
  }

  get totalBefore() {
    return this.firstItemIndex * this.minHeight;
  }

  get totalAfter() {
    return this.total - ((this.lastItemIndex + 1) * this.minHeight);
  }

  get firstItemIndex() {
    return this._firstItemIndex;
  }

  set firstItemIndex(index) {
    this._firstItemIndex = index;
  }

  get lastItemIndex() {
    return this._lastItemIndex;
  }

  set lastItemIndex(index) {
    this._lastItemIndex = index;
  }

  get firstVisibleIndex() {
    const firstVisibleIndex = Math.ceil(this.visibleTop / this.minHeight);

    return this.firstItemIndex === NULL_INDEX ? NULL_INDEX : firstVisibleIndex;
  }

  get lastVisibleIndex() {
    const lastVisibleIndex = Math.min(Math.ceil(this.visibleBottom / this.minHeight), this.totalItems - 1);

    return this.firstItemIndex === NULL_INDEX ? NULL_INDEX : lastVisibleIndex;
  }
}
