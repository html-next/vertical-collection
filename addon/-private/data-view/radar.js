import SkipList from './skip-list';

import scheduler from '../scheduler';
import Token from '../scheduler/token';

import { assert } from 'vertical-collection/-debug/helpers';

export default class Radar {
  constructor(scrollContainer, itemContainer, itemElements, totalItems, minValue, parentToken) {
    const {
      top: scrollContainerTop,
      height: scrollContainerHeight
    } = scrollContainer.getBoundingClientRect();

    const {
      top: itemContainerTop
    } = itemContainer.getBoundingClientRect();


    this.scrollContainerTop = scrollContainerTop;
    this.scrollContainerHeight = scrollContainerHeight;
    this.itemContainerTop = itemContainerTop;
    this.itemElements = itemElements;
    this.totalItems = totalItems;

    this.skipList = new SkipList(totalItems, minValue);
    this.token = new Token(parentToken);

    // Generally, visibleTop === container.scrollTop. However, if the container is larger than the
    // collection, this may not be the case (ex: Window is the container). In this case, we can say
    // that the visibleTop === container.scrollTop + offset, where offset is some constant distance.
    this._scrollTopOffset = scrollContainer.scrollTop + (itemContainerTop - scrollContainerTop);

    this.schedule('measure', () => {
      this._measure();
    });
  }

  schedule(queueName, job) {
    return scheduler.schedule(queueName, job, this.token);
  }

  get scrollTop() {
    return this._scrollTop;
  }

  set scrollTop(y) {
    const deltaScroll = y - (this._scrollTop || 0);
    this._scrollTop = y;

    this.itemContainerTop -= deltaScroll;

    this._updateBounds();

    this.schedule('measure', () => this._measure());
  }

  get scrollTopOffset() {
    return this._scrollTopOffset;
  }

  get visibleTop() {
    return this.scrollTop + this._scrollTopOffset;
  }

  set visibleTop(visibleTop) {
    assert('Must set visibleTop to a number', typeof visibleTop === 'number');

    this.scrollTop = visibleTop - this._scrollTopOffset;
  }

  get visibleBottom() {
    return this.visibleTop + this.scrollContainerHeight;
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
      totalAfter -= values[i];

      if (total - totalAfter <= visibleBottom) {
        return i;
      }
    }
  }

  _updateBounds() {
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
  }

  _measure() {
    const {
      itemElements,
      firstItemIndex,
      firstVisibleIndex,
      itemContainerTop,
      totalBefore,
      skipList
    } = this;

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
          margin = currentItemTop - previousItem.getBoundingClientRect().bottom;
        } else {
          margin = currentItemTop - itemContainerTop - totalBefore;
        }

        const itemDelta = skipList.set(itemIndex, currentItemHeight + margin);

        if (itemIndex < firstVisibleIndex) {
          this._scrollTop += itemDelta;
          this.itemContainerTop -= itemDelta;
        }

        currentItem.hasBeenMeasured = true;
      }
    }
  }

  prepend(numPrepended) {
    this.skipList.prepend(numPrepended);
    this.totalItems += numPrepended;
  }

  append(numAppended) {
    this.skipList.append(numAppended);
    this.totalItems += numAppended;
  }
}
