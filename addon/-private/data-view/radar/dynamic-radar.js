import Radar from './index';
import SkipList from '../skip-list';

import { assert } from 'vertical-collection/-debug/helpers';

export default class DynamicRadar extends Radar {
  constructor(options) {
    super(options);

    this.skipList = new SkipList(this.totalItems, this.minValue);

    this._update();
  }

  _update() {
    const { values } = this.skipList;
    const totalIndexes = this.itemElements.length;
    const maxIndex = this.totalItems - 1;

    const middleVisibleValue = this.visibleTop + (this.scrollContainerHeight  / 2);

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
      itemElements,
      firstItemIndex,
      itemContainerTop,
      totalBefore,
      skipList
    } = this;

    const staticVisibleIndex = this.renderFromLast ? this.lastVisibleIndex + 1 : this.firstVisibleIndex;

    let scrollTopDidChange = false;

    for (let i = 0; i < itemElements.length; i++) {
      let itemIndex = firstItemIndex + i;

      const currentItem = itemElements[i];

      if (currentItem.hasBeenMeasured === false) {
        const previousItem = itemElements[i - 1];

        const {
          top: currentItemTop,
          height: currentItemHeight
        } = currentItem.getBoundingClientRect();

        let margin;

        if (previousItem) {
          margin = Math.round(currentItemTop - previousItem.getBoundingClientRect().bottom);
        } else {
          margin = Math.round(currentItemTop - itemContainerTop - totalBefore);
        }

        assert(`item height must always be above minimum value. Item ${itemIndex} measured: ${currentItemHeight + margin}`, currentItemHeight + margin >= this.minValue);

        const itemDelta = skipList.set(itemIndex, currentItemHeight + margin);


        if (itemIndex < staticVisibleIndex && itemDelta !== 0) {
          this._scrollTop += itemDelta;
          this.itemContainerTop -= itemDelta;

          scrollTopDidChange = true;
        }

        currentItem.hasBeenMeasured = true;
      }
    }

    if (scrollTopDidChange) {
      this.scrollContainer.scrollTop = this._scrollTop;
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

  prepend(numPrepended) {
    this.skipList.prepend(numPrepended);

    super.prepend(numPrepended);
  }

  append(numAppended) {
    this.skipList.append(numAppended);

    super.append(numAppended);
  }
}
