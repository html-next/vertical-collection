import { default as Radar, NULL_INDEX } from './radar';
import SkipList from '../skip-list';
import roundTo from '../utils/round-to';

import { stripInProduction } from 'vertical-collection/-debug/helpers';

export default class DynamicRadar extends Radar {
  constructor(parentToken, initialItems, initialRenderCount, startingIndex) {
    super(parentToken, initialItems, initialRenderCount, startingIndex);

    this._firstItemIndex = NULL_INDEX;
    this._lastItemIndex = NULL_INDEX;

    this._totalBefore = 0;
    this._totalAfter = 0;

    this._firstRender = true;

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
      visibleMiddle,
      visibleBottom,
      totalItems,

      _prevFirstItemIndex
    } = this;

    if (totalItems === 0) {
      this._firstItemIndex = NULL_INDEX;
      this._lastItemIndex = NULL_INDEX;
      this._totalBefore = 0;
      this._totalAfter = 0;

      return;
    }

    // Don't measure if the radar has just been instantiated or reset, as we are rendering with a
    // completely new set of items and won't get an accurate measurement until after they render the
    // first time.
    if (_prevFirstItemIndex !== NULL_INDEX) {
      this._measure(_prevFirstItemIndex);
    }

    const { total, values } = skipList;

    let {
      totalBefore,
      index: middleItemIndex
    } = this.skipList.find(visibleMiddle);

    // Going down, totalBeforeBottom tracks the bottom of the current item, so add the height
    // of the initial item
    let totalBeforeBottom =  totalBefore + values[middleItemIndex];

    let firstItemIndex = middleItemIndex;
    let lastItemIndex = middleItemIndex;

    const maxIndex = totalItems - 1;

    // Get exact indexes based on current measurements
    while (totalBefore > visibleTop && firstItemIndex > 0) {
      firstItemIndex--;
      totalBefore -= values[firstItemIndex];
    }

    while (totalBeforeBottom < visibleBottom && lastItemIndex < maxIndex) {
      lastItemIndex++;
      totalBeforeBottom += values[lastItemIndex];
    }

    // Add buffers
    for (let i = bufferSize; i > 0 && firstItemIndex > 0; i--) {
      firstItemIndex--;
      totalBefore -= values[firstItemIndex];
    }

    for (let i = bufferSize; i > 0 && lastItemIndex < maxIndex; i--) {
      lastItemIndex++;
      totalBeforeBottom += values[lastItemIndex];
    }

    const itemDelta = (_prevFirstItemIndex !== null) ? firstItemIndex - _prevFirstItemIndex : 0;

    if (itemDelta < 0 || this._firstRender === true) {
      // schedule a measurement for items that could affect scrollTop
      this.schedule('measure', () => {
        const staticVisibleIndex = this.renderFromLast ? this.lastVisibleIndex + 1 : this.firstVisibleIndex;
        const numBeforeStatic = staticVisibleIndex - firstItemIndex;

        const measureLimit = this._firstRender ? numBeforeStatic : Math.max(Math.min(Math.abs(itemDelta), numBeforeStatic), 1);

        this._prependOffset += Math.round(this._measure(firstItemIndex, measureLimit));
        this._firstRender = false;
      });
    }

    this._firstItemIndex = firstItemIndex;
    this._lastItemIndex = lastItemIndex;
    this._totalBefore = totalBefore;
    this._totalAfter = Math.max(total - totalBeforeBottom, 0);
  }

  _measure(firstItemIndex, measureLimit = null) {
    const {
      orderedComponents,
      itemContainer,
      totalBefore,
      skipList
    } = this;

    const numToMeasure = measureLimit !== null ? measureLimit : orderedComponents.length;

    let totalDelta = 0;

    for (let i = 0; i < numToMeasure; i++) {
      const itemIndex = firstItemIndex + i;
      const currentItem = orderedComponents[i];
      const previousItem = orderedComponents[i - 1];

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
}
