import Ember from 'ember';

import { Token, scheduler } from '../../scheduler/index';

import VirtualComponent from '../virtual-component';
import insertRangeBefore from '../utils/insert-range-before';
import objectAt from '../utils/object-at';
import roundTo from '../utils/round-to';

import estimateElementHeight from '../../utils/element/estimate-element-height';

import { assert, stripInProduction } from 'vertical-collection/-debug/helpers';

const {
  A,
  get,
  set
} = Ember;

export default class Radar {
  constructor(parentToken, initialItems, initialRenderCount, startingIndex, shouldRecycle) {
    this.token = new Token(parentToken);

    this.items = initialItems;
    this.estimateHeight = 0;
    this.bufferSize = 0;
    this.startingIndex = startingIndex;
    this.shouldRecycle = shouldRecycle;
    this.renderFromLast = false;
    this.renderAll = false;
    this.itemContainer = null;
    this.scrollContainer = null;

    this._scrollTop = 0;
    this._prependOffset = 0;
    this._estimateHeight = 0;
    this._scrollTopOffset = 0;
    this._scrollContainerHeight = 0;

    this._nextUpdate = null;
    this._nextLayout = null;
    this._started = false;
    this._didReset = true;

    this._prevFirstItemIndex = 0;
    this._prevLastItemIndex = 0;
    this._prevFirstVisibleIndex = 0;
    this._prevLastVisibleIndex = 0;

    this._firstReached = false;
    this._lastReached = false;

    this.sendAction = () => {};

    this._occludedContentBefore = new VirtualComponent();
    this._occludedContentAfter = new VirtualComponent();

    this._occludedContentBefore.element = document.createElement('occluded-content');
    this._occludedContentAfter.element = document.createElement('occluded-content');

    this._occludedContentBefore.element.addEventListener('click', this.pageUp.bind(this));
    this._occludedContentAfter.element.addEventListener('click', this.pageDown.bind(this));

    const virtualComponents = [this._occludedContentBefore];
    const orderedComponents = [];

    const lastIndex = Math.min(startingIndex + initialRenderCount, get(initialItems, 'length'));
    const firstIndex = Math.max(0, lastIndex - initialRenderCount);

    for (let i = firstIndex; i < lastIndex; i++) {
      const component = new VirtualComponent;
      component.recycle(objectAt(initialItems, i), i);
      component.rendered = true;

      virtualComponents.push(component);
      orderedComponents.push(component);
    }

    virtualComponents.push(this._occludedContentAfter);

    this.virtualComponents = A(virtualComponents);
    this.orderedComponents = orderedComponents;
    this._componentPool = [];
    this._prependComponentPool = [];

    // In older versions of Ember/IE, binding anything on an object in the template
    // adds observers which creates __ember_meta__
    this.__ember_meta__ = null; // eslint-disable-line camelcase

    stripInProduction(() => this._debugDidUpdate = null);
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
    let { startingIndex } = this;

    if (startingIndex !== 0) {
      this._updateConstants();

      const {
        totalItems,
        renderFromLast,
        _estimateHeight,
        _scrollTopOffset,
        _scrollContainerHeight
      } = this;

      let startingScrollTop = startingIndex * _estimateHeight;

      if (renderFromLast) {
        startingScrollTop -= (_scrollContainerHeight - _estimateHeight);
      }

      // The container element needs to have some height in order for us to set the scroll position
      // on initialization, so we set this min-height property to radar's total
      this.itemContainer.style.minHeight = `${_estimateHeight * totalItems}px`;
      this.scrollContainer.scrollTop = startingScrollTop + _scrollTopOffset;

      this._occludedContentBefore.element.style.height = `${startingIndex * _estimateHeight}px`;
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

    this._nextUpdate = this.schedule('sync', () => {
      this._nextUpdate = null;

      this._scrollTop = this.scrollContainer.scrollTop;

      this._updateConstants();
      this._updateIndexes();
      this._updateVirtualComponents();

      this.schedule('measure', () => {
        // If there is a prependOffset of some kind _and_ the scrollTop has changed. Chrome will
        // automatically change the scrollTop for us in certain situations, which is why we need
        // to check the cache.
        if (this._prependOffset !== 0 && this._scrollTop === this.scrollContainer.scrollTop) {
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

        // Clear the reset flag
        this._didReset = false;

        stripInProduction(() => {
          // Hook to update the visual debugger
          if (this._debugDidUpdate != null) {
            this._debugDidUpdate(this);
          }
        });
      });
    });
  }

  _updateConstants() {
    const {
      estimateHeight,
      itemContainer,
      scrollContainer
    } = this;

    assert('Must provide a `estimateHeight` value to vertical-collection', estimateHeight !== null);
    assert('itemContainer must be set on Radar before scheduling an update', itemContainer !== null);
    assert('scrollContainer must be set on Radar before scheduling an update', scrollContainer !== null);

    const {
      top: itemContainerTop
    } = itemContainer.getBoundingClientRect();
    const {
      top: scrollContainerTop,
      height: scrollContainerHeight
    } = scrollContainer.getBoundingClientRect();

    let maxHeight = 0;
    if (scrollContainer instanceof Element) {
      const maxHeightString = window.getComputedStyle(scrollContainer).maxHeight;
      if (/\d+$/.test(maxHeightString)) {
        maxHeight = parseInt(maxHeightString);
      }
    }

    maxHeight = isNaN(maxHeight) ? 0 : maxHeight;

    this._estimateHeight = typeof estimateHeight === 'string' ? estimateElementHeight(itemContainer, estimateHeight) : estimateHeight;
    this._scrollTopOffset = roundTo(this._scrollTop + itemContainerTop - scrollContainerTop);
    this._scrollContainerHeight = Math.max(roundTo(scrollContainerHeight), maxHeight);
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
      _componentPool,

      shouldRecycle,
      _didReset,

      itemContainer,
      _occludedContentBefore,
      _occludedContentAfter,
      totalItems,

      renderedFirstItemIndex,
      renderedLastItemIndex,
      renderedTotalBefore,
      renderedTotalAfter,
      totalRendered
    } = this;

    // Add components to be recycled to the pool
    while (orderedComponents.length > 0 && orderedComponents[0].index < renderedFirstItemIndex) {
      _componentPool.push(orderedComponents.shift());
    }

    while (orderedComponents.length > 0 && orderedComponents[orderedComponents.length - 1].index > renderedLastItemIndex) {
      _componentPool.unshift(orderedComponents.pop());
    }

    if (_didReset) {
      if (shouldRecycle === true) {
        for (let i = 0; i < orderedComponents.length; i++) {
          // If the underlying array has changed, the indexes could be the same but
          // the content may have changed, so recycle the remaining components
          const component = orderedComponents[i];
          component.recycle(objectAt(items, component.index), component.index);
        }
      } else {
        while (orderedComponents.length > 0) {
          // If recycling is disabled we need to delete all components and clear the array
          _componentPool.push(orderedComponents.shift());
        }
      }
    }

    let firstIndexInList = orderedComponents[0] ? orderedComponents[0].index : renderedFirstItemIndex;
    let lastIndexInList = orderedComponents[orderedComponents.length - 1] ? orderedComponents[orderedComponents.length - 1].index : renderedFirstItemIndex - 1;

    // Append as many items as needed to the rendered components
    while (orderedComponents.length < totalRendered && lastIndexInList < renderedLastItemIndex) {
      let component;

      if (shouldRecycle === true) {
        component = _componentPool.pop() || new VirtualComponent();
      } else {
        component = new VirtualComponent();
      }

      const itemIndex = ++lastIndexInList;

      component.recycle(objectAt(items, itemIndex), itemIndex);
      this._appendComponent(component);

      orderedComponents.push(component);
    }

    // Prepend as many items as needed to the rendered components
    while (orderedComponents.length < totalRendered && firstIndexInList > renderedFirstItemIndex) {
      let component;

      if (shouldRecycle === true) {
        component = _componentPool.pop() || new VirtualComponent();
      } else {
        component = new VirtualComponent();
      }

      const itemIndex = --firstIndexInList;

      component.recycle(objectAt(items, itemIndex), itemIndex);
      this._prependComponent(component);

      orderedComponents.unshift(component);
    }

    // If there are any items remaining in the pool, remove them
    if (_componentPool.length > 0) {
      virtualComponents.removeObjects(_componentPool);
      _componentPool.length = 0;
    }

    const totalItemsBefore = renderedFirstItemIndex;
    const totalItemsAfter = totalItems - renderedLastItemIndex - 1;

    const beforeItemsText = totalItemsBefore === 1 ? 'item' : 'items';
    const afterItemsText = totalItemsAfter === 1 ? 'item' : 'items';

    // Set padding element heights, unset itemContainer's minHeight
    _occludedContentBefore.element.style.height = `${renderedTotalBefore}px`;
    _occludedContentBefore.element.innerHTML = totalItemsBefore > 0 ? `And ${totalItemsBefore} ${beforeItemsText} before` : '';

    _occludedContentAfter.element.style.height = `${renderedTotalAfter}px`;
    _occludedContentAfter.element.innerHTML = totalItemsAfter > 0 ? `And ${totalItemsAfter} ${afterItemsText} after` : '';

    itemContainer.style.minHeight = '';
  }

  _appendComponent(component) {
    const {
      virtualComponents,
      _occludedContentAfter
    } = this;

    if (component.rendered === true) {
      insertRangeBefore(_occludedContentAfter.realUpperBound, component.realUpperBound, component.realLowerBound);
    } else {
      virtualComponents.insertAt(virtualComponents.get('length') - 1, component);
      component.rendered = true;
    }
  }

  _prependComponent(component) {
    const {
      virtualComponents,
      _occludedContentBefore,
      _prependComponentPool
    } = this;

    if (component.rendered === true) {
      insertRangeBefore(_occludedContentBefore.realLowerBound.nextSibling, component.realUpperBound, component.realLowerBound);
    } else {
      virtualComponents.insertAt(virtualComponents.get('length') - 1, component);
      component.rendered = true;

      // Components that are both new and prepended still need to be rendered at the end because Glimmer.
      // We have to move them _after_ they render, so we schedule that if they exist
      _prependComponentPool.unshift(component);

      if (this._nextLayout === null) {
        this._nextLayout = this.schedule('layout', () => {
          this._nextLayout = null;

          while (_prependComponentPool.length > 0) {
            const component = _prependComponentPool.pop();

            insertRangeBefore(_occludedContentBefore.realLowerBound.nextSibling, component.realUpperBound, component.realLowerBound);
          }
        });
      }
    }
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
      _lastReached,
      _didReset
    } = this;

    if (_didReset || firstVisibleIndex !== _prevFirstVisibleIndex) {
      this.sendAction('firstVisibleChanged', firstVisibleIndex);
    }

    if (_didReset || lastVisibleIndex !== _prevLastVisibleIndex) {
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

  prepend(numPrepended) {
    this._prevFirstItemIndex += numPrepended;
    this._prevLastItemIndex += numPrepended;

    this.schedule('sync', () => {
      this.orderedComponents.forEach((c) => set(c, 'index', get(c, 'index') + numPrepended));
    });

    this._firstReached = false;

    this._prependOffset = numPrepended * this._estimateHeight;
  }

  append() {
    this._lastReached = false;
  }

  reset() {
    this._firstReached = false;
    this._lastReached = false;
    this._didReset = true;
  }

  pageUp() {
    const {
      bufferSize,
      renderedFirstItemIndex,
      totalRendered
    } = this;

    if (renderedFirstItemIndex !== 0) {
      const newFirstItemIndex = Math.max(renderedFirstItemIndex - totalRendered + bufferSize, 0);
      const offset = this.getOffsetForIndex(newFirstItemIndex);

      this.scrollContainer.scrollTop = offset + this._scrollTopOffset;
    }
  }

  pageDown() {
    const {
      bufferSize,
      renderedLastItemIndex,
      totalRendered,
      totalItems
    } = this;

    if (renderedLastItemIndex !== totalItems - 1) {
      const newFirstItemIndex = Math.min(renderedLastItemIndex + bufferSize + 1, totalItems - totalRendered);
      const offset = this.getOffsetForIndex(newFirstItemIndex);

      this.scrollContainer.scrollTop = offset + this._scrollTopOffset;
    }
  }

  // If `renderAll` is true, render components for all items. We intercept this here because
  // for all other behavior (action sending) we want to maintain the "correct" item indexes
  get renderedFirstItemIndex() {
    return this.renderAll === true ? 0 : this.firstItemIndex;
  }

  get renderedLastItemIndex() {
    return this.renderAll === true ? this.totalItems - 1 : this.lastItemIndex;
  }

  get renderedTotalBefore() {
    return this.renderAll === true ? 0 : this.totalBefore;
  }

  get renderedTotalAfter() {
    return this.renderAll === true ? 0 : this.totalAfter;
  }

  get totalRendered() {
    return this.renderAll === true ? this.totalItems : Math.min(this.totalItems, this.totalComponents);
  }

  get totalComponents() {
    return Math.ceil(this._scrollContainerHeight / this._estimateHeight) + (2 * this.bufferSize);
  }

  /*
   * `prependOffset` exists because there are times when we need to do the following in this exact
   * order:
   *
   * 1. Prepend, which means we need to adjust the scroll position by `estimateHeight * numPrepended`
   * 2. Calculate the items that will be displayed after the prepend, and move VCs around as
   *    necessary (`scheduleUpdate`).
   * 3. Actually add the amount prepended to `scrollContainer.scrollTop`
   *
   * This is due to some strange behavior in Chrome where it will modify `scrollTop` on it's own
   * when prepending item elements. We seem to avoid this behavior by doing these things in a RAF
   * in this exact order.
   */
  get visibleTop() {
    return Math.max(this._scrollTop - this._scrollTopOffset + this._prependOffset, 0);
  }

  get visibleMiddle() {
    return this.visibleTop + (this._scrollContainerHeight / 2);
  }

  get visibleBottom() {
    // There is a case where the container of this vertical collection could have height 0 at
    // initial render step but will be updated later. We want to return visibleBottom to be 0 rather
    // than -1.
    return Math.max(this.visibleTop + this._scrollContainerHeight - 1, 0);
  }

  get totalItems() {
    return this.items ? get(this.items, 'length') : 0;
  }
}
