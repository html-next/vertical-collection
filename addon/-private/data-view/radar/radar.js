import { A } from '@ember/array';
import { set, get } from '@ember/object';
import { assert } from '@ember/debug';
import { DEBUG } from '@glimmer/env';

import { Token, scheduler } from 'ember-raf-scheduler';

import VirtualComponent from '../virtual-component';
import insertRangeBefore from '../utils/insert-range-before';
import objectAt from '../utils/object-at';
import roundTo from '../utils/round-to';
import { isPrepend, isAppend } from '../utils/mutation-checkers';

import {
  addScrollHandler,
  removeScrollHandler
} from '../utils/scroll-handler';

import ViewportContainer from '../viewport-container';

import closestElement from '../../utils/element/closest';
import estimateElementSize from '../../utils/element/estimate-element-size';
import keyForItem from '../../ember-internals/key-for-item';
import { IS_EMBER_2 } from 'ember-compatibility-helpers';

const ALLOWED_DIMENSIONS = ['height', 'width'];

export default class Radar {
  constructor(
    parentToken,
    {
      bufferSize,
      containerSelector,
      dimension,
      estimateSize,
      initialRenderCount,
      items,
      key,
      renderAll,
      renderFromLast,
      shouldRecycle,
      startingIndex,
      occlusionTagName
    }
  ) {
    this.token = new Token(parentToken);

    // Public API
    this.bufferSize = bufferSize;
    this.containerSelector = containerSelector;
    this.estimateSize = estimateSize;
    this.initialRenderCount = initialRenderCount;
    this.items = items;
    this.key = key;
    this.renderAll = renderAll;
    this.renderFromLast = renderFromLast;
    this.shouldRecycle = shouldRecycle;
    this.startingIndex = startingIndex;

    // Default to height-based collection
    this._dimension = dimension || 'height';

    assert(
      `dimension must be one of 'height' or 'width', got ${dimension}`,
      ALLOWED_DIMENSIONS.includes(this._dimension)
    );

    if (this._dimension === 'height') {
      this._getScrollContainerMaxSize = () => window.getComputedStyle(this._scrollContainer).maxHeight;
      this._getScrollContainerOffset = () => this._scrollContainer.offsetHeight;
      this._getScrollContainerSize = () => this._scrollContainer.getBoundingClientRect().height;
      this._getScrollDistance = () => this._scrollContainer.scrollTop;
      this._getScaledStartPosition = (element, scale) => element.getBoundingClientRect().top * scale;
      this._setDimension = (element, styleForHeight) => element.style.height = styleForHeight;
      this._setScrollDistance = (scrollDistance) => this._scrollContainer.scrollTop = scrollDistance;

      this._scrollHandler = ({ top }) => {
        // debounce scheduling updates by checking to make sure we've moved a minimum amount
        if (this._didEarthquake(Math.abs(this._scrollDistance - top))) {
          this.scheduleUpdate();
        }
      };
    } else {
      this._getScrollContainerMaxSize = () => window.getComputedStyle(this._scrollContainer).maxWidth;
      this._getScrollContainerOffset = () => this._scrollContainer.offsetWidth;
      this._getScrollContainerSize = () => this._scrollContainer.getBoundingClientRect().width;
      this._getScrollDistance = () => this._scrollContainer.scrollLeft;
      this._getScaledStartPosition = (element, scale) => element.getBoundingClientRect().left * scale;
      this._setDimension = (element, styleForWidth) => element.style.width = styleForWidth;
      this._setScrollDistance = (scrollDistance) => this._scrollContainer.scrollLeft = scrollDistance;

      this._scrollHandler = ({ left }) => {
        // debounce scheduling updates by checking to make sure we've moved a minimum amount
        if (this._didEarthquake(Math.abs(this._scrollDistance - left))) {
          this.scheduleUpdate();
        }
      };
    }

    // defaults to a no-op intentionally, actions will only be sent if they
    // are passed into the component
    this.sendAction = () => {};

    // Calculated constants
    this._itemContainer = null;
    this._scrollContainer = null;
    this._prependOffset = 0;
    this._calculatedEstimateSize = 0;
    this._collectionOffset = 0;
    this._calculatedScrollContainerSize = 0;
    this._transformScale = 1;

    // Event handler
    this._resizeHandler = this.scheduleUpdate.bind(this);

    // Run state
    this._nextUpdate = null;
    this._nextLayout = null;
    this._started = false;
    this._didReset = true;
    this._didUpdateItems = false;

    // Cache state
    this._scrollDistance = 0;

    // Setting these values to infinity starts us in a guaranteed good state for the radar,
    // so it knows that it needs to run certain measurements, etc.
    this._prevFirstItemIndex = Infinity;
    this._prevLastItemIndex = -Infinity;
    this._prevFirstVisibleIndex = 0;
    this._prevLastVisibleIndex = 0;

    this._firstReached = false;
    this._lastReached = false;
    this._prevTotalItems = 0;
    this._prevFirstKey = 0;
    this._prevLastKey = 0;

    this._componentPool = [];
    this._prependComponentPool = [];

    // Boundaries
    this._occludedContentBefore = new VirtualComponent(this._dimension);
    this._occludedContentAfter = new VirtualComponent(this._dimension);

    this._occludedContentBefore.element = document.createElement(occlusionTagName);
    this._occludedContentBefore.element.className += 'occluded-content';
    this._occludedContentAfter.element = document.createElement(occlusionTagName);
    this._occludedContentAfter.element.className += 'occluded-content';

    this._occludedContentBefore.element.addEventListener('click', this.pageUp.bind(this));
    this._occludedContentAfter.element.addEventListener('click', this.pageDown.bind(this));

    // Element to hold pooled component DOM when not in use
    this._domPool = document.createDocumentFragment();

    // Initialize virtual components
    this.virtualComponents = A([this._occludedContentBefore, this._occludedContentAfter]);
    this.orderedComponents = [];

    this._updateVirtualComponents();

    // In older versions of Ember/IE, binding anything on an object in the template
    // adds observers which creates __ember_meta__
    if (!IS_EMBER_2) {
      this.__ember_meta__ = undefined; // eslint-disable-line camelcase
    }

    if (DEBUG) {
      this._debugDidUpdate = null;
    }
  }

  destroy() {
    this.token.cancel();

    for (let i = 0; i < this.orderedComponents.length; i++) {
      this.orderedComponents[i].destroy();
    }

    this.orderedComponents = null;
    set(this, 'virtualComponents', null);

    if (this._started) {
      removeScrollHandler(this._scrollContainer, this._scrollHandler);
      ViewportContainer.removeEventListener('resize', this._resizeHandler);
    }
  }

  schedule(queueName, job) {
    return scheduler.schedule(queueName, job, this.token);
  }

  /**
   * Start the Radar. Does initial measurements, adds event handlers,
   * sets up initial scroll state, and
   */
  start() {
    const {
      startingIndex,
      containerSelector,
      _occludedContentBefore
    } = this;

    // Use the occluded content element, which has been inserted into the DOM,
    // to find the item container and the scroll container
    this._itemContainer = _occludedContentBefore.element.parentNode;
    this._scrollContainer = containerSelector === 'body' ? ViewportContainer : closestElement(this._itemContainer, containerSelector);

    this._updateConstants();

    // Setup initial scroll state
    if (startingIndex !== 0) {
      const {
        renderFromLast,
        _calculatedEstimateSize,
        _collectionOffset,
        _calculatedScrollContainerSize
      } = this;

      let startingScrollDistance = startingIndex * _calculatedEstimateSize;

      if (renderFromLast) {
        startingScrollDistance -= (_calculatedScrollContainerSize - _calculatedEstimateSize);
      }

      // initialize the scrollDistance value, which will be applied to the
      // scrollContainer after the collection has been initialized
      this._scrollDistance = startingScrollDistance + _collectionOffset;

      this._prevFirstVisibleIndex = startingIndex;
    }

    this._started = true;
    this.update();

    // Setup event handlers
    addScrollHandler(this._scrollContainer, this._scrollHandler);
    ViewportContainer.addEventListener('resize', this._resizeHandler);
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
  scheduleUpdate(didUpdateItems) {
    if (didUpdateItems === true) {
      // Set the update items flag first, in case scheduleUpdate has already been called
      // but the RAF hasn't yet run
      this._didUpdateItems = true;
    }

    if (this._nextUpdate !== null || this._started === false) {
      return;
    }

    this._nextUpdate = this.schedule('sync', () => {
      this._nextUpdate = null;
      this._scrollDistance = this._getScrollDistance(this._scrollContainer);

      this.update();
    });
  }

  update() {
    if (this._didUpdateItems === true) {
      this._determineUpdateType();
      this._didUpdateItems = false;
    }

    this._updateConstants();
    this._updateIndexes();
    this._updateVirtualComponents();

    this.schedule('measure', this.afterUpdate.bind(this));
  }

  afterUpdate() {
    const { _prevTotalItems: totalItems } = this;

    const scrollDiff = this._calculateScrollDiff();

    if (scrollDiff !== 0) {
      this._setScrollDistance(this._getScrollDistance() + scrollDiff);
    }

    // Re-sync scroll distance, since Chrome may have intervened
    this._scrollDistance = this._getScrollDistance();

    // Unset prepend offset, we're done with any prepend changes at this point
    this._prependOffset = 0;

    if (totalItems !== 0) {
      this._sendActions();
    }

    // Cache previous values
    this._prevFirstItemIndex = this.firstItemIndex;
    this._prevLastItemIndex = this.lastItemIndex;
    this._prevFirstVisibleIndex = this.firstVisibleIndex;
    this._prevLastVisibleIndex = this.lastVisibleIndex;

    // Clear the reset flag
    this._didReset = false;

    if (DEBUG && this._debugDidUpdate !== null) {
      // Hook to update the visual debugger
      this._debugDidUpdate(this);
    }
  }

  /*
   * The scroll diff is the difference between where we want the container's scrollTop/scrollLeft to
   * be, and where it actually is right now. By default it accounts for the `_prependOffset`, which
   * is set when items are added to the front of the collection, as well as any discrepancies
   * that may have arisen between the cached `_scrollDistance` value and the actually container's
   * scrollTop/scrollLeft. The container's scrollTop/scrollLeft may be modified by the browser when
   * we manipulate DOM (Chrome specifically does this a lot), so `_scrollDistance` should be
   * considered the canonical scrollTop/scrollLeft.
   *
   * Subclasses should override this method to provide any difference between expected item size
   * pre-render and actual item size post-render.
   */
  _calculateScrollDiff() {
    return (this._prependOffset + this._scrollDistance)
      - this._getScrollDistance();
  }

  _determineUpdateType() {
    const {
      items,
      key,
      totalItems,

      _prevTotalItems,
      _prevFirstKey,
      _prevLastKey
    } = this;

    const lenDiff = totalItems - _prevTotalItems;

    if (isPrepend(lenDiff, items, key, _prevFirstKey, _prevLastKey) === true) {
      this.prepend(lenDiff);
    } else if (isAppend(lenDiff, items, key, _prevFirstKey, _prevLastKey) === true) {
      this.append(lenDiff);
    } else {
      this.reset();
    }

    const firstItem = objectAt(this.items, 0);
    const lastItem = objectAt(this.items, this.totalItems - 1);

    this._prevTotalItems = totalItems;
    this._prevFirstKey = totalItems > 0 ? keyForItem(firstItem, key, 0) : 0;
    this._prevLastKey = totalItems > 0 ? keyForItem(lastItem, key, totalItems - 1) : 0;
  }

  _updateConstants() {
    const {
      estimateSize,
      _occludedContentBefore,
      _itemContainer,
      _scrollContainer
    } = this;

    assert('Must provide a `estimateSize` value to vertical-collection', estimateSize !== null);
    assert('itemContainer must be set on Radar before scheduling an update', _itemContainer !== null);
    assert('scrollContainer must be set on Radar before scheduling an update', _scrollContainer !== null);

    // The scroll container's offset size will reflect the actual size the element, while it's
    // measured size, via bounding client rect, will reflect the size with any transformations
    // applied. We use this to find out the scale of the items so we can store measurements at the
    // correct heights/widths.
    const scrollContainerOffsetSize = this._getScrollContainerOffset();
    const scrollContainerRenderedSize = this._getScrollContainerSize();

    let transformScale;

    // transformScale represents the opposite of the scale, if any, applied to the collection. Check for equality
    // to guard against floating point errors, and check to make sure we're not dividing by zero (default to scale 1 if so)
    if (scrollContainerOffsetSize === scrollContainerRenderedSize || scrollContainerRenderedSize === 0) {
      transformScale = 1;
    } else {
      transformScale = scrollContainerOffsetSize / scrollContainerRenderedSize;
    }

    const { startPosition: scrollContentStartPosition }
      = _occludedContentBefore.getScaledPositionInformation(transformScale);
    const scrollContainerStartPosition = this._getScaledStartPosition(_scrollContainer, transformScale);

    let scrollContainerMaxSize = 0;

    if (_scrollContainer instanceof Element) {
      const maxSizeStyle = this._getScrollContainerMaxSize();

      if (maxSizeStyle !== 'none') {
        scrollContainerMaxSize = estimateElementSize(_scrollContainer.parentElement, maxSizeStyle);
      }
    }

    const calculatedEstimateSize = typeof estimateSize === 'string'
      ? estimateElementSize(_itemContainer, estimateSize)
      : estimateSize;

    assert(
      `calculatedEstimateSize must be greater than 0, instead was "${calculatedEstimateSize}" based on estimateSize: ${estimateSize}`,
      calculatedEstimateSize > 0
    );

    this._transformScale = transformScale;
    this._calculatedEstimateSize = calculatedEstimateSize;
    this._calculatedScrollContainerSize
      = roundTo(Math.max(scrollContainerOffsetSize, scrollContainerMaxSize));

    // The offset between the beginning of the collection and the beginning of the scroll container.
    // Determined by finding the distance the collection is from the beginning of the scroll
    // container's content (scrollDistance + actual position) and subtracting the scroll container's
    //  actual beginning.
    this._collectionOffset
      = roundTo((this._getScrollDistance() + scrollContentStartPosition) - scrollContainerStartPosition);
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
      renderAll,
      _started,
      _didReset,

      _occludedContentBefore,
      _occludedContentAfter,
      totalItems
    } = this;

    let renderedFirstItemIndex, renderedLastItemIndex, renderedTotalBefore, renderedTotalAfter;

    if (renderAll === true) {
      // All items should be rendered, set indexes based on total item count
      renderedFirstItemIndex = 0;
      renderedLastItemIndex = totalItems - 1;
      renderedTotalBefore = 0;
      renderedTotalAfter = 0;

    } else if (_started === false) {
      // The Radar hasn't been started yet, render the initialRenderCount if it exists
      renderedFirstItemIndex = this.startingIndex;
      renderedLastItemIndex = this.startingIndex + this.initialRenderCount - 1;
      renderedTotalBefore = 0;
      renderedTotalAfter = 0;

    } else {
      renderedFirstItemIndex = this.firstItemIndex;
      renderedLastItemIndex = this.lastItemIndex;
      renderedTotalBefore = this.totalBefore;
      renderedTotalAfter = this.totalAfter;

    }

    // If there are less items available than rendered, we drop the last rendered item index
    renderedLastItemIndex = Math.min(renderedLastItemIndex, totalItems - 1);

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

    let firstIndexInList = orderedComponents.length > 0 ? orderedComponents[0].index : renderedFirstItemIndex;
    let lastIndexInList = orderedComponents.length > 0 ? orderedComponents[orderedComponents.length - 1].index : renderedFirstItemIndex - 1;

    // Append as many items as needed to the rendered components
    while (lastIndexInList < renderedLastItemIndex) {
      let component;

      if (shouldRecycle === true) {
        component = _componentPool.pop() || new VirtualComponent(this._dimension);
      } else {
        component = new VirtualComponent(this._dimension);
      }

      const itemIndex = ++lastIndexInList;

      component.recycle(objectAt(items, itemIndex), itemIndex);
      this._appendComponent(component);

      orderedComponents.push(component);
    }

    // Prepend as many items as needed to the rendered components
    while (firstIndexInList > renderedFirstItemIndex) {
      let component;

      if (shouldRecycle === true) {
        component = _componentPool.pop() || new VirtualComponent(this._dimension);
      } else {
        component = new VirtualComponent(this._dimension);
      }

      const itemIndex = --firstIndexInList;

      component.recycle(objectAt(items, itemIndex), itemIndex);
      this._prependComponent(component);

      orderedComponents.unshift(component);
    }

    // If there are any items remaining in the pool, remove them
    if (_componentPool.length > 0) {
      if (shouldRecycle === true) {
        // Grab the DOM of the remaining components and move it to temporary node disconnected from
        // the body. If we end up using these components again, we'll grab their DOM and put it back
        for (let i = 0; i < _componentPool.length; i++) {
          const component = _componentPool[i];

          insertRangeBefore(this._domPool, null, component.realUpperBound, component.realLowerBound);
        }
      } else {
        virtualComponents.removeObjects(_componentPool);
        _componentPool.length = 0;
      }
    }

    const totalItemsBefore = renderedFirstItemIndex;
    const totalItemsAfter = totalItems - renderedLastItemIndex - 1;

    const beforeItemsText = totalItemsBefore === 1 ? 'item' : 'items';
    const afterItemsText = totalItemsAfter === 1 ? 'item' : 'items';

    // Set padding element sizes.
    this._setDimension(_occludedContentBefore.element, `${Math.max(renderedTotalBefore, 0)}px`);
    _occludedContentBefore.element.innerHTML = totalItemsBefore > 0 ? `And ${totalItemsBefore} ${beforeItemsText} before` : '';

    this._setDimension(_occludedContentAfter.element, `${Math.max(renderedTotalAfter, 0)}px`);
    _occludedContentAfter.element.innerHTML = totalItemsAfter > 0 ? `And ${totalItemsAfter} ${afterItemsText} after` : '';
  }

  _appendComponent(component) {
    const {
      virtualComponents,
      _occludedContentAfter,
      _itemContainer
    } = this;

    const relativeNode = _occludedContentAfter.realUpperBound;

    if (component.rendered === true) {
      insertRangeBefore(_itemContainer, relativeNode, component.realUpperBound, component.realLowerBound);
    } else {
      virtualComponents.insertAt(virtualComponents.get('length') - 1, component);
      component.rendered = true;
    }
  }

  _prependComponent(component) {
    const {
      virtualComponents,
      _occludedContentBefore,
      _prependComponentPool,
      _itemContainer
    } = this;

    const relativeNode = _occludedContentBefore.realLowerBound.nextSibling;

    if (component.rendered === true) {
      insertRangeBefore(_itemContainer, relativeNode, component.realUpperBound, component.realLowerBound);
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

            // Changes with each inserted component
            const relativeNode = _occludedContentBefore.realLowerBound.nextSibling;

            insertRangeBefore(_itemContainer, relativeNode, component.realUpperBound, component.realLowerBound);
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

    this.orderedComponents.forEach((c) => set(c, 'index', get(c, 'index') + numPrepended));

    this._firstReached = false;

    this._prependOffset = numPrepended * this._calculatedEstimateSize;
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
    if (this.renderAll) {
      return; // All items rendered, no need to page up
    }

    const {
      bufferSize,
      firstItemIndex,
      totalComponents
    } = this;

    if (firstItemIndex !== 0) {
      const newFirstItemIndex = Math.max(firstItemIndex - totalComponents + bufferSize, 0);
      const offset = this.getOffsetForIndex(newFirstItemIndex);

      this._setScrollDistance(offset + this._collectionOffset);
      this.scheduleUpdate();
    }
  }

  pageDown() {
    if (this.renderAll) {
      return; // All items rendered, no need to page down
    }

    const {
      bufferSize,
      lastItemIndex,
      totalComponents,
      totalItems
    } = this;

    if (lastItemIndex !== totalItems - 1) {
      const newFirstItemIndex = Math.min(lastItemIndex + bufferSize + 1, totalItems - totalComponents);
      const offset = this.getOffsetForIndex(newFirstItemIndex);

      this._setScrollDistance(offset + this._collectionOffset);
      this.scheduleUpdate();
    }
  }

  get totalComponents() {
    return Math.min(this.totalItems, (this.lastItemIndex - this.firstItemIndex) + 1);
  }

  /*
   * `prependOffset` exists because there are times when we need to do the following in this exact
   * order:
   *
   * 1. Prepend, which means we need to adjust the scroll position by `estimateSize * numPrepended`
   * 2. Calculate the items that will be displayed after the prepend, and move VCs around as
   *    necessary (`scheduleUpdate`).
   * 3. Actually add the amount prepended to `scrollContainer.scrollTop`/`scrollContainer.scrollLeft`
   *
   * This is due to some strange behavior in Chrome where it will modify `scrollTop`/`scrollLeft`
   * on it's own when prepending item elements. We seem to avoid this behavior by doing these
   * things in a RAF in this exact order.
   */
  get visibleStart() {
    return Math.max(this._scrollDistance - this._collectionOffset + this._prependOffset, 0);
  }

  get visibleMiddle() {
    return this.visibleStart + (this._calculatedScrollContainerSize / 2);
  }

  get visibleEnd() {
    // There is a case where the container of this vertical collection could have height 0 at
    // initial render step but will be updated later. We want to return visibleEnd to be 0 rather
    // than -1.
    return Math.max(this.visibleStart + this._calculatedScrollContainerSize - 1, 0);
  }

  get totalItems() {
    return this.items ? get(this.items, 'length') : 0;
  }
}
