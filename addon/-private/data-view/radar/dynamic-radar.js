import Radar from './radar';
import SkipList from '../skip-list';
import roundTo from '../utils/round-to';

import { stripInProduction } from 'vertical-collection/-debug/helpers';

export default class DynamicRadar extends Radar {
  constructor(parentToken, initialItems, initialRenderCount, startingIndex, shouldRecycle) {
    super(parentToken, initialItems, initialRenderCount, startingIndex, shouldRecycle);

    this._firstItemIndex = 0;
    this._lastItemIndex = 0;

    this._totalBefore = 0;
    this._totalAfter = 0;

    this.skipList = null;

    stripInProduction(() => {
      Object.preventExtensions(this);
    });
  }

  destroy() {
    super.destroy();

    this.skipList = null;
  }

  _updateIndexes() {
    const {
      bufferSize,
      skipList,
      visibleTop,
      visibleBottom,
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

    let { totalBefore, index: firstVisibleIndex } = this.skipList.find(visibleTop);
    let { totalAfter, index: lastVisibleIndex } = this.skipList.find(visibleBottom);

    const maxIndex = totalItems - 1;

    let firstItemIndex = firstVisibleIndex;
    let lastItemIndex = lastVisibleIndex;

    // Add buffers
    for (let i = bufferSize; i > 0 && firstItemIndex > 0; i--) {
      firstItemIndex--;
      totalBefore -= values[firstItemIndex];
    }

    for (let i = bufferSize; i > 0 && lastItemIndex < maxIndex; i--) {
      lastItemIndex++;
      totalAfter -= values[lastItemIndex];
    }

    const itemDelta = (_prevFirstItemIndex !== null) ? firstItemIndex - _prevFirstItemIndex : lastItemIndex - firstItemIndex;

    if (itemDelta < 0 || itemDelta >= totalComponents) {
      this.schedule('measure', () => {
        // schedule a measurement for items that could affect scrollTop
        const staticVisibleIndex = this.renderFromLast ? lastVisibleIndex + 1 : firstVisibleIndex;
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
      itemContainer,
      totalBefore,
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
        margin = currentItemTop - itemContainer.getBoundingClientRect().top - totalBefore;
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

    this.skipList = new SkipList(this.totalItems, this.estimateHeight);
  }

  /*
   * Public API to query the skiplist for the offset of an item
   */
  getOffsetForIndex(index) {
    this._measure();

    return this.skipList.getOffset(index);
  }
}
