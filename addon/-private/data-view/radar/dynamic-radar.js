import { default as Radar, NULL_INDEX } from './radar';
import SkipList from '../skip-list';

import { assert } from 'vertical-collection/-debug/helpers';

export default class DynamicRadar extends Radar {
  constructor() {
    super();

    this._firstItemIndex = NULL_INDEX;
    this._lastItemIndex = NULL_INDEX;

    this._totalBefore = 0;
    this._totalAfter = 0;

    this._firstRender = true;

    this.skipList = null;
  }

  init(...args) {
    super.init(...args);

    this.skipList = new SkipList(this.totalItems, this.minHeight);
  }

  destroy() {
    super.destroy();

    this.skipList = null;
  }

  _updateIndexes() {
    const { values } = this.skipList;
    const maxIndex = this.totalItems - 1;
    const numComponents = this.orderedComponents.length;
    const prevFirstItemIndex = this._prevFirstItemIndex;
    const prevLastItemIndex = this._prevLastItemIndex;
    const middleVisibleValue = this.visibleTop + ((this.visibleBottom - this.visibleTop) / 2);

    // Don't measure if the radar has just been instantiated or reset, as we are rendering with a
    // completely new set of items and won't get an accurate measurement until after they render the
    // first time.
    if (prevFirstItemIndex !== NULL_INDEX) {
      // We only need to measure the components that were rendered last time, extra components
      // haven't rendered yet.
      this._measure(0, prevLastItemIndex - prevFirstItemIndex);
    }

    let {
      totalBefore,
      totalAfter,
      index: middleItemIndex
    } = this.skipList.find(middleVisibleValue);

    let firstItemIndex = middleItemIndex - Math.floor((numComponents - 1) / 2);
    let lastItemIndex = middleItemIndex + Math.ceil((numComponents - 1) / 2);

    if (firstItemIndex < 0) {
      firstItemIndex = 0;
      lastItemIndex = numComponents - 1;
    }

    if (lastItemIndex > maxIndex) {
      lastItemIndex = maxIndex;
      firstItemIndex = maxIndex - (numComponents - 1);
    }

    for (let i = middleItemIndex - 1; i >= firstItemIndex; i--) {
      totalBefore -= values[i];
    }

    for (let i = middleItemIndex; i <= lastItemIndex; i++) {
      totalAfter -= values[i];
    }

    const itemDelta = (prevFirstItemIndex !== null) ? firstItemIndex - prevFirstItemIndex : 0;
    const numCulled = Math.abs(itemDelta % numComponents);

    if (itemDelta < 0 || this._firstRender) {
      // schedule a measurement for items that could affect scrollTop
      this.schedule('measure', () => {
        const staticVisibleIndex = this.renderFromLast ? this.lastVisibleIndex + 1 : this.firstVisibleIndex;
        const numBeforeStatic = staticVisibleIndex - firstItemIndex;

        const lastIndex = this._firstRender ? numBeforeStatic - 1 : Math.min(numCulled, numBeforeStatic - 1);
        this._prependOffset += this._measure(0, lastIndex);
        this._firstRender = false;
      });
    }

    this._firstItemIndex = firstItemIndex;
    this._lastItemIndex = lastItemIndex;
    this._totalBefore = totalBefore;
    this._totalAfter = totalAfter;
  }

  _measure(firstComponentIndex, lastComponentIndex) {
    const {
      firstItemIndex,
      orderedComponents,
      itemContainer,
      totalBefore,
      skipList
    } = this;

    let totalDelta = 0;

    for (let i = firstComponentIndex; i <= lastComponentIndex; i++) {
      const itemIndex = firstItemIndex + i;
      const currentItem = orderedComponents[i];
      const previousItem = orderedComponents[i - 1];

      const {
        top: currentItemTop,
        height: currentItemHeight
      } = currentItem.getBoundingClientRect();

      let margin;

      if (previousItem) {
        margin = currentItemTop - previousItem.getBoundingClientRect().bottom;
      } else {
        margin = currentItemTop - itemContainer.getBoundingClientRect().top - totalBefore;
      }

      assert(`item height + margin must always be above the minimum value ${this.minHeight}px. The item at index ${itemIndex} measured: ${currentItemHeight + margin}`, currentItemHeight + margin >= this.minHeight);

      const itemDelta = skipList.set(itemIndex, currentItemHeight + margin);

      if (itemDelta !== 0) {
        totalDelta += itemDelta;
      }
    }

    return totalDelta;
  }

  get total() {
    return this.skipList.total;
  }

  get totalBefore() {
    return this._totalBefore;
  }

  get totalAfter() {
    return this._totalAfter;
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
    if (this.firstItemIndex === NULL_INDEX) {
      return NULL_INDEX;
    }

    const { values } = this.skipList;

    let {
      firstItemIndex,
      lastItemIndex,
      totalBefore,
      visibleTop
    } = this;

    for (let i = firstItemIndex; i <= lastItemIndex; i++) {
      totalBefore += values[i];

      if (totalBefore > visibleTop) {
        return i;
      }
    }
  }

  get lastVisibleIndex() {
    if (this.lastItemIndex === NULL_INDEX) {
      return NULL_INDEX;
    }

    const { total, values } = this.skipList;

    let {
      firstItemIndex,
      lastItemIndex,
      totalAfter,
      visibleBottom
    } = this;

    for (let i = lastItemIndex; i >= firstItemIndex; i--) {
      totalAfter += values[i];

      if (total - totalAfter <= visibleBottom) {
        return i;
      }
    }
  }

  prepend(items, numPrepended) {
    super.prepend(items, numPrepended);

    this.skipList.prepend(numPrepended);
  }

  append(items, numAppended) {
    super.append(items, numAppended);

    this.skipList.append(numAppended);
  }

  updateItems(items, isReset) {
    super.updateItems(items, isReset);

    if (isReset) {
      this.skipList = new SkipList(this.totalItems, this.minHeight);
    }
  }
}
