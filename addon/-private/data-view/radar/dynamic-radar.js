import { default as Radar, NULL_INDEX } from './radar';
import SkipList from '../skip-list';

import { assert, stripInProduction } from 'vertical-collection/-debug/helpers';

export default class DynamicRadar extends Radar {
  constructor() {
    super();

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
    const prevFirstItemIndex = this._prevFirstItemIndex;
    const prevLastItemIndex = this._prevLastItemIndex;
    const middleVisibleValue = this.visibleMiddle;
    const { totalComponents } = this;

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

    for (let i = middleItemIndex - 1; i >= firstItemIndex; i--) {
      totalBefore -= values[i];
    }

    for (let i = middleItemIndex; i <= lastItemIndex; i++) {
      totalAfter -= values[i];
    }

    const itemDelta = (prevFirstItemIndex !== null) ? firstItemIndex - prevFirstItemIndex : 0;
    const numCulled = Math.abs(itemDelta % totalComponents);

    if (itemDelta < 0 || this._firstRender === true) {
      // schedule a measurement for items that could affect scrollTop
      this.schedule('measure', () => {
        const staticVisibleIndex = this.renderFromLast ? this.lastVisibleIndex + 1 : this.firstVisibleIndex;
        const numBeforeStatic = staticVisibleIndex - firstItemIndex;

        const lastIndex = this._firstRender ? numBeforeStatic - 1 : Math.max(Math.min(numCulled, numBeforeStatic - 1), 0);
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

      // TODO add explicit test
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

  prepend(items, numPrepended) {
    super.prepend(items, numPrepended);

    this.skipList.prepend(numPrepended);
  }

  append(items, numAppended) {
    super.append(items, numAppended);

    this.skipList.append(numAppended);
  }

  reset(items) {
    super.reset(items);

    this.skipList = new SkipList(this.totalItems, this.minHeight);
  }
}
