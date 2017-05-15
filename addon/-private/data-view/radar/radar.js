import Ember from 'ember';

import { Token, scheduler } from '../../scheduler/index';

import VirtualComponent from '../virtual-component';
import insertRangeBefore from '../utils/insert-range-before';
import objectAt from '../utils/object-at';

import estimateElementHeight from '../../utils/element/estimate-element-height';

import { assert } from 'vertical-collection/-debug/helpers';

const {
  A,
  get,
  set
} = Ember;

// Whenever a
export const NULL_INDEX = -2;

export default class Radar {
  constructor(parentToken) {
    this.token = new Token(parentToken);

    this.items = null;
    this.minHeight = 0;
    this.bufferSize = 0;
    this.startingScrollTop = 0;
    this.renderFromLast = false;
    this.itemContainer = null;
    this.scrollContainer = null;

    this._scrollTop = 0;
    this._prependOffset = 0;
    this._minHeight = 0;
    this._scrollTopOffset = 0;
    this._scrollContainerHeight = 0;

    this._nextUpdate = null;
    this._started = false;

    this._prevFirstItemIndex = NULL_INDEX;
    this._prevLastItemIndex = NULL_INDEX;
    this._prevFirstVisibleIndex = NULL_INDEX;
    this._prevLastVisibleIndex = NULL_INDEX;
    this._firstItemIndex = NULL_INDEX;
    this._lastItemIndex = NULL_INDEX;

    this._firstReached = false;
    this._lastReached = false;

    this.sendAction = () => {};

    this._occludedContentBefore = new VirtualComponent();
    this._occludedContentAfter = new VirtualComponent();

    this._occludedContentBefore.element = document.createElement('occluded-content');
    this._occludedContentAfter.element = document.createElement('occluded-content');

    this.virtualComponents = A([this._occludedContentBefore, this._occludedContentAfter]);
    this.orderedComponents = [];
  }

  destroy() {
    this.token.cancel();

    for (let i = 0; i < this.orderedComponents.length; i++) {
      this.orderedComponents[i].destroy();
    }

    this.orderedComponents = null;
    set(this, 'virtualComponents', null);
  }

  schedule(queueName, job) {
    return scheduler.schedule(queueName, job, this.token);
  }

  start() {
    let { startingScrollTop } = this;

    if (this.startingScrollTop !== 0) {
      this._updateConstants();

      const {
        minHeight,
        totalItems,
        renderFromLast,
        _scrollTopOffset
      } = this;

      if (renderFromLast) {
        startingScrollTop -= (this._radar.scrollContainerHeight - minHeight);
      }

      // The container element needs to have some height in order for us to set the scroll position
      // on initialization, so we set this min-height property to radar's total
      this.itemContainer.style.minHeight = `${minHeight * totalItems}px`;
      this.scrollContainer.scrollTop = startingScrollTop + _scrollTopOffset;
    }

    this._started = true;
    this.scheduleUpdate();
  }

  /*
   * Schedules an update for the next RAF
   *
   * This will first run _updateVirtualComponents in the sync phase, which figures out what
   * components need to be rerendered and updates the appropriate VCs and moves their associated
   * DOM. At the end of the `sync` phase the runloop is flushed and Glimmer renders the changes.
   *
   * By the `affect` phase the Radar should have had time to measure, meaning it has all of the
   * current info and we can send actions for any changes.
   *
   * @private
   */
  scheduleUpdate() {
    if (this._nextUpdate !== null || this._started === false) {
      return;
    }

    this._nextUpdate = this.schedule('layout', () => {
      this._nextUpdate = null;

      this._scrollTop = this.scrollContainer.scrollTop;

      this._updateConstants();
      this._updateIndexes();
      this._updateVirtualComponents();

      this.schedule('measure', () => {
        if (this.scrollContainer.scrollTop - this._scrollTopOffset !== this.visibleTop) {
          this.scrollContainer.scrollTop += this._prependOffset;
        }

        this._prependOffset = 0;

        if (this.totalItems !== 0) {
          this._sendActions();
        }

        // cache previous values
        this._prevFirstItemIndex = this.firstItemIndex;
        this._prevLastItemIndex = this.lastItemIndex;
        this._prevFirstVisibleIndex = this.firstVisibleIndex;
        this._prevLastVisibleIndex = this.lastVisibleIndex;
      });
    });
  }

  _updateConstants() {
    const {
      minHeight,
      itemContainer,
      scrollContainer
    } = this;

    assert('Must provide a `minHeight` value to vertical-collection', minHeight !== null);
    assert('itemContainer must be set on Radar before scheduling an update', itemContainer !== null);
    assert('scrollContainer must be set on Radar before scheduling an update', scrollContainer !== null);

    const {
      top: itemContainerTop
    } = itemContainer.getBoundingClientRect();
    const {
      top: scrollContainerTop,
      height: scrollContainerHeight
    } = scrollContainer.getBoundingClientRect();

    const maxHeight = scrollContainer.style ? parseInt(scrollContainer.style.maxHeight || 0) : 0;

    this._minHeight = typeof minHeight === 'string' ? estimateElementHeight(itemContainer, minHeight) : minHeight;
    this._scrollTopOffset = this._scrollTop + itemContainerTop - scrollContainerTop;
    this._scrollContainerHeight = Math.max(scrollContainerHeight, maxHeight);
  }

  /*
   * Updates virtualComponents, which is meant to be a static pool of components that we render to.
   * In order to decrease the time spent rendering and diffing, we pull the {{each}} out of the DOM
   * and only replace the content of _virtualComponents which are removed/added.
   *
   * For instance, if we start with the following and scroll down, items 2 and 3 do not need to be
   * rerendered, only item 1 needs to be removed and only item 4 needs to be added. So we replace
   * item 1 with item 4, and then manually move the DOM:
   *
   *   1                        4                         2
   *   2 -> replace 1 with 4 -> 2 -> manually move DOM -> 3
   *   3                        3                         4
   *
   * However, _virtualComponents is still out of order. Rather than keep track of the state of
   * things in _virtualComponents, we track the visually ordered components in the
   * _orderedComponents array. This is possible because all of our operations are relatively simple,
   * popping some number of components off one end and pushing them onto the other.
   *
   * @private
   */
  _updateVirtualComponents() {
    const {
      items,
      orderedComponents,
      virtualComponents,

      itemContainer,
      _occludedContentBefore,
      _occludedContentAfter,

      firstItemIndex,
      lastItemIndex,
      totalBefore,
      totalAfter,

      totalComponents
    } = this;

    const itemDelta = totalComponents - orderedComponents.length;

    const componentPool = [];

    // Add new components to the pool
    for (let i = 0; i < itemDelta; i++) {
      componentPool.push(new VirtualComponent());
    }

    // Add components to be recycled to the pool
    while (orderedComponents.length > 0 && orderedComponents[0].index < firstItemIndex) {
      componentPool.push(orderedComponents.shift());
    }

    while (orderedComponents.length > 0 && orderedComponents[orderedComponents.length - 1].index > lastItemIndex) {
      componentPool.unshift(orderedComponents.pop());
    }

    // If rendered components are empty, add one back so the rest of the logic remains the same
    if (orderedComponents.length === 0 && totalComponents > 0) {
      const component = componentPool.pop();
      component.recycle(objectAt(items, firstItemIndex), firstItemIndex);

      if (component.rendered === true) {
        insertRangeBefore(_occludedContentBefore.realLowerBound.nextSibling, component.realUpperBound, component.realLowerBound);
      } else {
        virtualComponents.insertAt(1, component);
        component.rendered = true;
      }

      orderedComponents.unshift(component);
    }

    // Prepend as many items as needed to the rendered components
    while (orderedComponents.length < totalComponents && orderedComponents[0].index > firstItemIndex) {
      const component = componentPool.pop();

      const itemIndex = orderedComponents[0].index - 1;
      component.recycle(objectAt(items, itemIndex), itemIndex);

      if (component.rendered === true) {
        insertRangeBefore(_occludedContentBefore.realLowerBound.nextSibling, component.realUpperBound, component.realLowerBound);
      } else {
        virtualComponents.insertAt(1, component);
        component.rendered = true;
      }

      orderedComponents.unshift(component);
    }

    // Append as many items as needed to the rendered components
    while (orderedComponents.length < totalComponents && orderedComponents[orderedComponents.length - 1].index < lastItemIndex) {
      const component = componentPool.pop();

      const itemIndex = orderedComponents[orderedComponents.length - 1].index + 1;
      component.recycle(objectAt(items, itemIndex), itemIndex);

      if (component.rendered === true) {
        insertRangeBefore(_occludedContentAfter.realUpperBound, component.realUpperBound, component.realLowerBound);
      } else {
        virtualComponents.insertAt(virtualComponents.get('length') - 1, component);
        component.rendered = true;
      }

      orderedComponents.push(component);
    }

    // If there are any items remaining in the pool, remove them
    if (componentPool.length > 0) {
      virtualComponents.removeObjects(componentPool);
    }

    // Set padding element heights, unset itemContainer's minHeight
    _occludedContentBefore.element.style.height = `${totalBefore}px`;
    _occludedContentAfter.element.style.height = `${totalAfter}px`;
    itemContainer.style.minHeight = '';
  }

  _sendActions() {
    const {
      firstItemIndex,
      lastItemIndex,
      firstVisibleIndex,
      lastVisibleIndex,

      _prevFirstVisibleIndex,
      _prevLastVisibleIndex,

      totalItems,

      _firstReached,
      _lastReached
    } = this;

    if (firstVisibleIndex !== _prevFirstVisibleIndex) {
      this.sendAction('firstVisibleChanged', firstVisibleIndex);
    }

    if (lastVisibleIndex !== _prevLastVisibleIndex) {
      this.sendAction('lastVisibleChanged', lastVisibleIndex);
    }

    if (_firstReached === false && firstItemIndex === 0) {
      this.sendAction('firstReached', firstItemIndex);
      this._firstReached = true;
    }

    if (_lastReached === false && lastItemIndex === totalItems - 1) {
      this.sendAction('lastReached', lastItemIndex);
      this._lastReached = true;
    }
  }

  prepend(items, numPrepended) {
    this.items = items;
    this._prevFirstItemIndex += numPrepended;
    this._prevLastItemIndex += numPrepended;

    this.schedule('sync', () => {
      this.orderedComponents.forEach((c) => set(c, 'index', get(c, 'index') + numPrepended));
    });

    this._firstReached = false;

    this._prependOffset = numPrepended * this.minHeight;
  }

  append(items) {
    this.items = items;

    this._lastReached = false;
  }

  reset(items) {
    this.items = items;

    this._prevFirstItemIndex = NULL_INDEX;
    this._prevLastItemIndex = NULL_INDEX;

    this._firstReached = false;
    this._lastReached = false;
  }

  /*
   * `prependOffset` exists because there are times when we need to do the following in this exact
   * order:
   *
   * 1. Prepend, which means we need to adjust the scroll position by `minHeight * numPrepended`
   * 2. Calculate the items that will be displayed after the prepend, and move VCs around as
   *    necessary (`scheduleUpdate`).
   * 3. Actually add the amount prepended to `scrollContainer.scrollTop`
   *
   * This is due to some strange behavior in Chrome where it will modify `scrollTop` on it's own
   * when prepending item elements. We seem to avoid this behavior by doing these things in a RAF
   * in this exact order.
   */
  get visibleTop() {
    return this._scrollTop - this._scrollTopOffset + this._prependOffset;
  }

  get visibleBottom() {
    return this.visibleTop + this._scrollContainerHeight;
  }

  get visibleMiddle() {
    return Math.max(this.visibleTop, 0) + (this._scrollContainerHeight / 2);
  }

  get totalItems() {
    return this.items ? get(this.items, 'length') : 0;
  }

  get totalComponents() {
    const {
      _scrollContainerHeight,
      _minHeight,
      bufferSize,
      totalItems
    } = this;

    // The total number of components is determined by the minimum number required to span the
    // container plus its buffers. Combined with the above rendering strategy this is fairly
    // performant, even if mean item size is above the minimum.
    const calculatedComponents = Math.ceil(_scrollContainerHeight / _minHeight) + 1 + (bufferSize * 2);
    return Math.min(totalItems, calculatedComponents);
  }
}
