import { default as Radar, NULL_INDEX } from './radar';
import { stripInProduction } from 'vertical-collection/-debug/helpers';

export default class StaticRadar extends Radar {
  constructor() {
    super();

    this._firstItemIndex = NULL_INDEX;
    this._lastItemIndex = NULL_INDEX;

    stripInProduction(() => {
      Object.preventExtensions(this);
    });
  }

  _updateIndexes() {
    const {
      totalComponents,
      totalItems,
      visibleMiddle,
      _minHeight
    } = this;

    if (totalItems === 0) {
      this._firstItemIndex = NULL_INDEX;
      this._lastItemIndex = NULL_INDEX;

      return;
    }

    const maxIndex = totalItems - 1;
    const middleItemIndex = Math.floor(visibleMiddle / _minHeight);

    let firstItemIndex = middleItemIndex - Math.floor((totalComponents - 1) / 2);
    let lastItemIndex = middleItemIndex + Math.ceil((totalComponents - 1) / 2);

    if (firstItemIndex < 0) {
      firstItemIndex = 0;
      lastItemIndex = totalComponents - 1;
    }

    if (lastItemIndex > maxIndex) {
      lastItemIndex = maxIndex;
      firstItemIndex = maxIndex - (totalComponents - 1);
    }

    this._firstItemIndex = firstItemIndex;
    this._lastItemIndex = lastItemIndex;
  }

  get total() {
    return this.totalItems * this._minHeight;
  }

  get totalBefore() {
    return this.firstItemIndex * this._minHeight;
  }

  get totalAfter() {
    return this.total - ((this.lastItemIndex + 1) * this._minHeight);
  }

  get firstItemIndex() {
    return this._firstItemIndex;
  }

  get lastItemIndex() {
    return this._lastItemIndex;
  }

  get firstVisibleIndex() {
    const firstVisibleIndex = Math.ceil(this.visibleTop / this._minHeight);

    return this.firstItemIndex === NULL_INDEX ? NULL_INDEX : firstVisibleIndex;
  }

  get lastVisibleIndex() {
    const lastVisibleIndex = Math.min(Math.ceil(this.visibleBottom / this._minHeight), this.totalItems - 1);

    return this.firstItemIndex === NULL_INDEX ? NULL_INDEX : lastVisibleIndex;
  }
}
