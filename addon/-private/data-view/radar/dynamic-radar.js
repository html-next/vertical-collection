import Radar from './radar';
// import SkipList from '../skip-list';
import SkipList from '../rb-tree/rb-tree-wrapper';
// import RbTreeWrapper from '../rb-tree/rb-tree-wrapper';
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
    this.rbTreeWrapper =  null;

    stripInProduction(() => {
      Object.preventExtensions(this);
    });
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
      // this.rbTreeWrapper = new RbTreeWrapper(this.totalItems, this._estimateHeight);
    } else {
      this.skipList.defaultValue = this._estimateHeight;
      // this.rbTreeWrapper.defaultValue = this._estimateHeight;
    }
  }

  _updateIndexes() {
    const {
      skipList,
      rbTreeWrapper,
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

    // const { values } = skipList;

    let { totalBefore, totalAfter, index: middleItemIndex } = this.skipList.find(visibleMiddle);
    // let { totalBefore: before2, totalAfter: after2, index: index2 } = this.rbTreeWrapper.find(visibleMiddle);
    // if (index2 === middleItemIndex) {
    //   console.log('Equal ' + index2);
    // }
    // if (before2 !== totalBefore || after2 !== totalAfter || index2 !== middleItemIndex) {
    //   console.log(middleItemIndex, index2, totalBefore, before2);
    //   // debugger
    //   // this.rbTreeWrapper.find(visibleMiddle);
    //   // throw new Error('Not matching')
    // }

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
      const value = skipList.getValues(i);
      // if (Math.abs(value - rbTreeWrapper.getValues(i)) > 0.01) {
      //   debugger;
      //   rbTreeWrapper.getValues(i)
      // }
      totalBefore -= value;
    }

    for (let i = middleItemIndex + 1; i <= lastItemIndex; i++) {
      const value = skipList.getValues(i);
      // if (Math.abs(value - rbTreeWrapper.getValues(i)) > 0.01) {
      //   debugger;
      // }
      totalAfter -= value;
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
      itemContainer,
      totalBefore,
      skipList,
      rbTreeWrapper
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
      // rbTreeWrapper.set(itemIndex, roundTo(currentItemHeight + margin));

      if (itemDelta !== 0) {
        totalDelta += itemDelta;
      }
    }

    return totalDelta;
  }

  get total() {
    debugger
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
    // this.rbTreeWrapper.prepend(numPrepended);
  }

  append(numAppended) {
    super.append(numAppended);

    this.skipList.append(numAppended);
    // this.rbTreeWrapper.append(numAppended);
  }

  reset() {
    super.reset();

    if (this.skipList !== null) {
      this.skipList.reset(this.totalItems);
      // this.rbTreeWrapper.reset(this.totalItems);
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
