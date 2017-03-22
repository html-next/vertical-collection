import Radar from './index';

export default class StaticRadar extends Radar {
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

  get lastItemIndex() {
    return this._lastItemIndex;
  }

  get firstVisibleIndex() {
    return Math.ceil(this.visibleTop / this.minHeight);
  }

  get lastVisibleIndex() {
    return Math.ceil(this.visibleBottom / this.minHeight);
  }
}
