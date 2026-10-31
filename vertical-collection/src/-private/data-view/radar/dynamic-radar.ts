import { assert } from '@ember/debug';
import { DEBUG } from '@glimmer/env';

import { type Token } from 'ember-raf-scheduler';

import Radar, { type RadarOptions } from './radar.ts';
import SkipList from '../skip-list.ts';
import roundTo from '../utils/round-to.ts';
import getScaledClientRect from '../../utils/element/get-scaled-client-rect.ts';

export default class DynamicRadar<T = unknown> extends Radar<T> {
  declare _firstItemIndex: number;
  declare _lastItemIndex: number;
  declare _totalBefore: number;
  declare _totalAfter: number;
  declare _minHeight: number;
  declare _nextIncrementalRender: Token | null;
  declare _skipList: SkipList | null;

  constructor(parentToken: Token, options: RadarOptions<T>) {
    super(parentToken, options);

    this._firstItemIndex = 0;
    this._lastItemIndex = 0;

    this._totalBefore = 0;
    this._totalAfter = 0;

    this._minHeight = Infinity;

    this._nextIncrementalRender = null;

    this._skipList = null;

    if (DEBUG) {
      Object.preventExtensions(this);
    }
  }

  scheduleUpdate(didUpdateItems?: boolean, promiseResolve?: () => void): void {
    // Cancel incremental render check, since we'll be remeasuring anyways
    if (this._nextIncrementalRender !== null) {
      this._nextIncrementalRender.cancel();
      this._nextIncrementalRender = null;
    }

    super.scheduleUpdate(didUpdateItems, promiseResolve);
  }

  afterUpdate(): void {
    // Schedule a check to see if we should rerender
    if (this._nextIncrementalRender === null && this._nextUpdate === null) {
      this._nextIncrementalRender = this.schedule('sync', () => {
        this._nextIncrementalRender = null;

        if (this._shouldScheduleRerender()) {
          this.update();
        }
      });
    }

    super.afterUpdate();
  }

  _updateConstants(): void {
    super._updateConstants();

    if (this._calculatedEstimateHeight < this._minHeight) {
      this._minHeight = this._calculatedEstimateHeight;
    }

    // Create the SkipList only after the estimateHeight has been calculated the first time
    if (this._skipList === null) {
      this._skipList = new SkipList(
        this.totalItems,
        this._calculatedEstimateHeight,
      );
    } else {
      this._skipList.defaultValue = this._calculatedEstimateHeight;
    }
  }

  get skipList(): SkipList {
    assert(
      'The skip list is made on the first measurement, before the first update',
      this._skipList !== null,
    );

    return this._skipList;
  }

  _updateIndexes(): void {
    const {
      skipList,
      bufferSize,
      visibleTop,
      visibleBottom,
      totalItems,

      _didReset,
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

    let { totalBefore, index: firstVisibleIndex } = skipList.find(visibleTop);
    let { totalAfter, index: lastVisibleIndex } = skipList.find(visibleBottom);

    const maxIndex = totalItems - 1;

    let firstItemIndex = firstVisibleIndex;
    let lastItemIndex = lastVisibleIndex;

    // Add buffers
    for (let i = bufferSize; i > 0 && firstItemIndex > 0; i--) {
      firstItemIndex--;
      totalBefore -= values[firstItemIndex]!;
    }

    for (let i = bufferSize; i > 0 && lastItemIndex < maxIndex; i--) {
      lastItemIndex++;
      totalAfter -= values[lastItemIndex]!;
    }

    this._firstItemIndex = firstItemIndex;
    this._lastItemIndex = lastItemIndex;
    this._totalBefore = totalBefore;
    this._totalAfter = totalAfter;
  }

  _calculateScrollDiff(): number {
    const { firstItemIndex, _prevFirstVisibleIndex, _prevFirstItemIndex } =
      this;

    let beforeVisibleDiff = 0;

    if (firstItemIndex < _prevFirstItemIndex) {
      // Measurement only items that could affect scrollTop. This will necesarilly be the
      // minimum of the either the total number of items that are rendered up to the first
      // visible item, OR the number of items that changed before the first visible item
      // (the delta). We want to measure the delta of exactly this number of items, because
      // items that are after the first visible item should not affect the scroll position,
      // and neither should items already rendered before the first visible item.
      const measureLimit = Math.min(
        Math.abs(firstItemIndex - _prevFirstItemIndex),
        _prevFirstVisibleIndex - firstItemIndex,
      );

      beforeVisibleDiff = Math.round(this._measure(measureLimit));
    }

    return beforeVisibleDiff + super._calculateScrollDiff();
  }

  _shouldScheduleRerender(): boolean {
    const { firstItemIndex, lastItemIndex } = this;

    this._updateConstants();
    this._measure();

    // These indexes could change after the measurement, and in the incremental render
    // case we want to check them _after_ the change.
    const { firstVisibleIndex, lastVisibleIndex } = this;

    return (
      firstVisibleIndex < firstItemIndex || lastVisibleIndex > lastItemIndex
    );
  }

  _measure(measureLimit: number | null = null): number {
    const {
      orderedComponents,
      skipList,
      _occludedContentBefore,
      _transformScale,
    } = this;

    const numToMeasure =
      measureLimit !== null
        ? Math.min(measureLimit, orderedComponents.length)
        : orderedComponents.length;

    let totalDelta = 0;

    for (let i = 0; i < numToMeasure; i++) {
      const currentItem = orderedComponents[i]!;
      const previousItem = orderedComponents[i - 1];
      const itemIndex = currentItem.index;

      const { top: currentItemTop, height: currentItemHeight } =
        getScaledClientRect(currentItem, _transformScale);

      let margin;

      if (previousItem !== undefined) {
        margin =
          currentItemTop -
          getScaledClientRect(previousItem, _transformScale).bottom;
      } else {
        margin =
          currentItemTop -
          getScaledClientRect(_occludedContentBefore, _transformScale).bottom;
      }

      const newHeight = roundTo(currentItemHeight + margin);
      const itemDelta = skipList.set(itemIndex, newHeight);

      if (newHeight < this._minHeight) {
        this._minHeight = newHeight;
      }

      if (itemDelta !== 0) {
        totalDelta += itemDelta;
      }
    }

    return totalDelta;
  }

  _didEarthquake(scrollDiff: number): boolean {
    return scrollDiff > this._minHeight / 2;
  }

  get total(): number {
    return this.skipList.total;
  }

  get totalBefore(): number {
    return this._totalBefore;
  }

  get totalAfter(): number {
    return this._totalAfter;
  }

  get firstItemIndex(): number {
    return this._firstItemIndex;
  }

  get lastItemIndex(): number {
    return this._lastItemIndex;
  }

  get firstVisibleIndex(): number {
    const { visibleTop } = this;

    const { index } = this.skipList.find(visibleTop);

    return index;
  }

  get lastVisibleIndex(): number {
    const { visibleBottom, totalItems } = this;

    const { index } = this.skipList.find(visibleBottom);

    return Math.min(index, totalItems - 1);
  }

  prepend(numPrepended: number): void {
    super.prepend(numPrepended);

    this.skipList.prepend(numPrepended);
  }

  append(numAppended: number): void {
    super.append(numAppended);

    this.skipList.append(numAppended);
  }

  reset(): void {
    super.reset();

    this.skipList.reset(this.totalItems);
  }

  /*
   * Public API to query the skiplist for the offset of an item
   */
  getOffsetForIndex(index: number): number {
    this._measure();

    return this.skipList.getOffset(index);
  }
}
