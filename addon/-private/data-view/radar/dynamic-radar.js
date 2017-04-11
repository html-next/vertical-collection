import Radar from './index';
import SkipList from '../skip-list';
import Ember from 'ember';

import { assert } from 'vertical-collection/-debug/helpers';

const { run } = Ember;

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
    const maxIndex = this.totalItems - 1;
    const numComponents = this.orderedComponents.length;
    const prevFirstItemIndex = this.firstItemIndex;
    const middleVisibleValue = this.visibleTop + ((this.visibleBottom - this.visibleTop) / 2);

    this._measure(0, numComponents - 1);

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

    const itemDelta = prevFirstItemIndex ? firstItemIndex - prevFirstItemIndex : 0;
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

    run.next(() => {
      this._measure(0, numComponents - 1);
    });

    this._firstItemIndex = firstItemIndex;
    this._lastItemIndex = lastItemIndex;
    this._totalBefore = totalBefore;
    this._totalAfter = totalAfter;

    return itemDelta;
  }

  _measure(firstComponentIndex, lastComponentIndex) {
    const {
      firstItemIndex,
      orderedComponents,
      itemContainer,
      skipList
    } = this;

    let totalDelta = 0;

    for (let i = firstComponentIndex; i <= lastComponentIndex; i++) {
      const itemIndex = firstItemIndex + i;
      const currentItem = orderedComponents[i];
      const previousItem = orderedComponents[i - 1];

      if (!currentItem.inDOM) {
        continue;
      }

      const {
        top: currentItemTop,
        height: currentItemHeight
      } = currentItem.getBoundingClientRect();

      let margin;

      if (previousItem) {
        margin = Math.round(currentItemTop - previousItem.getBoundingClientRect().bottom);
      } else {
        margin = Math.round(currentItemTop - itemContainer.getBoundingClientRect().top);
      }

      assert(`item height must always be above minimum value. Item ${itemIndex} measured: ${currentItemHeight + margin}`, currentItemHeight + margin >= this.minHeight);

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

      if (total - totalAfter <= visibleBottom) {
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
    this._firstRender = true;

    super.resetItems(items);
  }
}
