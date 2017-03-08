import Radar from './index';
import SkipList from '../skip-list';

import { assert } from 'vertical-collection/-debug/helpers';

export default class DynamicRadar extends Radar {
  init(...args) {
    super.init(...args);

    if (!this.initialized) {
      this.skipList = new SkipList(this.items.length, this.minHeight);
      this.initialized = true;
    }
  }

  destroy() {
    super.destroy();

    this.skipList = null;
  }

  _updateIndexes() {
    const { values } = this.skipList;
    const totalIndexes = this.orderedComponents.length;
    const maxIndex = this.totalItems - 1;

    const middleVisibleValue = this.visibleTop + ((this.visibleBottom - this.visibleTop) / 2);

    let {
      totalBefore,
      totalAfter,
      index: middleItemIndex
    } = this.skipList.find(middleVisibleValue);

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

    for (let i = middleItemIndex - 1; i >= firstItemIndex; i--) {
      totalBefore -= values[i];
    }

    for (let i = middleItemIndex; i <= lastItemIndex; i++) {
      totalAfter -= values[i];
    }

    this._firstItemIndex = firstItemIndex;
    this._lastItemIndex = lastItemIndex;
    this._totalBefore = totalBefore;
    this._totalAfter = totalAfter;

    this.schedule('measure', () => this._measure());
  }

  _measure() {
    const {
      firstItemIndex,
      orderedComponents,
      itemContainer,
      totalBefore,
      skipList
    } = this;

    const staticVisibleIndex = this.renderFromLast ? this.lastVisibleIndex + 1 : this.firstVisibleIndex;

    let totalDelta = 0;

    for (let i = 0; i < orderedComponents.length; i++) {
      let itemIndex = firstItemIndex + i;

      const currentItem = orderedComponents[i];

      if (currentItem.hasBeenMeasured === false) {
        const previousItem = orderedComponents[i - 1];

        const {
          top: currentItemTop,
          height: currentItemHeight
        } = currentItem.getBoundingClientRect();

        let margin;

        if (previousItem) {
          margin = Math.round(currentItemTop - previousItem.getBoundingClientRect().bottom);
        } else {
          margin = Math.round(currentItemTop - itemContainer.getBoundingClientRect().top - totalBefore);
        }

        assert(`item height must always be above minimum value. Item ${itemIndex} measured: ${currentItemHeight + margin}`, currentItemHeight + margin >= this.minHeight);

        const itemDelta = skipList.set(itemIndex, currentItemHeight + margin);

        if (itemIndex < staticVisibleIndex && itemDelta !== 0) {
          totalDelta += itemDelta;
        }

        currentItem.hasBeenMeasured = true;
      }
    }

    if (totalDelta > 0) {
      this.scrollContainer.scrollTop += totalDelta;
    }
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
    const { total, values } = this.skipList;

    let {
      firstItemIndex,
      lastItemIndex,
      totalAfter,
      visibleBottom
    } = this;

    for (let i = lastItemIndex; i >= firstItemIndex; i--) {
      totalAfter += values[i];

      if (total - totalAfter < visibleBottom) {
        return i;
      }
    }
  }

  prepend(items, numPrepended) {
    this.skipList.prepend(numPrepended);

    super.prepend(items, numPrepended);
  }

  append(items, numAppended) {
    this.skipList.append(numAppended);

    super.append(items, numAppended);
  }

  resetItems(items) {
    this.skipList = new SkipList(items.length, this.minHeight);

    super.resetItems(items);
  }
}
