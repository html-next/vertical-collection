import { DEBUG } from '@glimmer/env';

import Radar from './radar';
import SkipList from '../skip-list';
import roundTo from '../utils/round-to';

export default class DynamicRadar extends Radar {
  constructor(parentToken, options) {
    super(parentToken, options);

    this._firstItemIndex = 0;
    this._lastItemIndex = 0;

    this._totalBefore = 0;
    this._totalAfter = 0;

    this.skipList = null;

    if (DEBUG) {
      Object.preventExtensions(this);
    }
  }

  destroy() {
    super.destroy();

    this.skipList = null;
  }

  _updateConstants() {
    super._updateConstants();

    // Create the SkipList only after the estimateHeight has been calculated the first time
    if (this.skipList === null) {
      this.skipList = new SkipList(this.totalItems, this._estimateHeight);
    } else {
      this.skipList.defaultValue = this._estimateHeight;
    }
  }

  _updateIndexes() {
    const {
      skipList,
      visibleMiddle,
      totalItems,
      totalComponents,

      _prevFirstItemIndex,
      _didReset
    } = this;

    if (totalItems === 0) {
      this._firstItemIndex = 0;
      this._lastItemIndex = -1;
      this._totalBefore = 0;
      this._totalAfter = 0;

      return;
    }

    // Don't measure if the radar has just been instantiated or reset, as we are rendering with a
    // completely new set of items and won't get an accurate measurement until after they render the
    // first time.
    if (_didReset === false) {
      this._measure();
    }

    const { values } = skipList;

    let { totalBefore, totalAfter, index: middleItemIndex } = this.skipList.find(visibleMiddle);

    const maxIndex = totalItems - 1;

    let firstItemIndex = middleItemIndex - Math.floor(totalComponents / 2);
    let lastItemIndex = middleItemIndex + Math.ceil(totalComponents / 2) - 1;

    if (firstItemIndex < 0) {
      firstItemIndex = 0;
      lastItemIndex = Math.min(totalComponents - 1, maxIndex);
    }

    if (lastItemIndex > maxIndex) {
      lastItemIndex = maxIndex;
      firstItemIndex = Math.max(maxIndex - (totalComponents - 1), 0);
    }

    // Add buffers
    for (let i = middleItemIndex - 1; i >= firstItemIndex; i--) {
      totalBefore -= values[i];
    }

    for (let i = middleItemIndex + 1; i <= lastItemIndex; i++) {
      totalAfter -= values[i];
    }

    const itemDelta = (_prevFirstItemIndex !== null) ? firstItemIndex - _prevFirstItemIndex : lastItemIndex - firstItemIndex;

    if (itemDelta < 0 || itemDelta >= totalComponents) {
      this.schedule('measure', () => {
        // schedule a measurement for items that could affect scrollTop
        const staticVisibleIndex = this.renderFromLast ? this.lastVisibleIndex + 1 : this.firstVisibleIndex;
        const numBeforeStatic = staticVisibleIndex - firstItemIndex;

        const measureLimit = Math.min(Math.abs(itemDelta), numBeforeStatic);

        this._prependOffset += Math.round(this._measure(measureLimit));
      });
    }

    this._firstItemIndex = firstItemIndex;
    this._lastItemIndex = lastItemIndex;
    this._totalBefore = totalBefore;
    this._totalAfter = totalAfter;
  }

  _measure(measureLimit = null) {
    const {
      orderedComponents,
      _occludedContentBefore,
      skipList
    } = this;

    const numToMeasure = measureLimit !== null ? measureLimit : orderedComponents.length;

    let totalDelta = 0;

    for (let i = 0; i < numToMeasure; i++) {
      const currentItem = orderedComponents[i];
      const previousItem = orderedComponents[i - 1];
      const itemIndex = currentItem.index;

      const {
        top: currentItemTop,
        height: currentItemHeight
      } = currentItem.getBoundingClientRect();

      let margin;

      if (previousItem !== undefined) {
        margin = currentItemTop - previousItem.getBoundingClientRect().bottom;
      } else {
        margin = currentItemTop - _occludedContentBefore.getBoundingClientRect().bottom;
      }

      const itemDelta = skipList.set(itemIndex, roundTo(currentItemHeight + margin));

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

  get lastItemIndex() {
    return this._lastItemIndex;
  }

  get firstVisibleIndex() {
    const {
      visibleTop
    } = this;

    const { index } = this.skipList.find(visibleTop);

    return index;
  }

  get lastVisibleIndex() {
    const {
      visibleBottom,
      totalItems
    } = this;

    const { index } = this.skipList.find(visibleBottom);

    return Math.min(index, totalItems - 1);
  }

  prepend(numPrepended) {
    super.prepend(numPrepended);

    this.skipList.prepend(numPrepended);
  }

  append(numAppended) {
    super.append(numAppended);

    this.skipList.append(numAppended);
  }

  reset() {
    super.reset();

    if (this.skipList !== null) {
      this.skipList.reset(this.totalItems);
    }
  }

  /*
   * Public API to query the skiplist for the offset of an item
   */
  getOffsetForIndex(index) {
    this._measure();

    return this.skipList.getOffset(index);
  }
}
