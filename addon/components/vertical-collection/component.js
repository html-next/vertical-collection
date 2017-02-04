/* global Array, Math */
import Ember from 'ember';
import layout from './template';

import scheduler from '../../-private/scheduler';
import Token from '../../-private/scheduler/token';

import estimateElementHeight from '../../-private/utils/element/estimate-element-height';
import closestElement from '../../-private/utils/element/closest';

import GeometryManager from '../../-private/data-view/geometry-manager';
import LazyKeyList from '../../-private/data-view/lazy-key-list';
import Container from '../../-private/data-view/container';
import getArray from '../../-private/data-view/utils/get-array';
import {
  addScrollHandler,
  removeScrollHandler
} from 'vertical-collection/-private/data-view/utils/scroll-handler';

import VirtualComponent from '../../-private/virtual-component';
import { assert, debugOnError } from 'vertical-collection/-debug/helpers';

const {
  A,
  set,
  computed,
  Component,
  String: { htmlSafe }
} = Ember;

const VerticalCollection = Component.extend({
  layout,

  /*
   * If itemTagName is blank or null, the `vertical-collection` will [tag match](../addon/utils/get-tag-descendant.js)
   * with the `vertical-item`.
   */
  tagName: 'vertical-collection',
  boxStyle: htmlSafe(''),

  key: '@identity',
  content: computed.deprecatingAlias('items'),

  // –––––––––––––– Required Settings

  minHeight: 75,

  // usable via {{#vertical-collection <items-array>}}
  items: null,

  // –––––––––––––– Optional Settings
  alwaysRemeasure: false,
  alwaysUseDefaultHeight: computed.not('alwaysRemeasure'),

  /*
   * A selector string that will select the element from
   * which to calculate the viewable height and needed offsets.
   *
   * This element will also have the `scroll` event handler added to it.
   *
   * Usually this element will be the component's immediate parent element,
   * if so, you can leave this null.
   *
   * Set this to "body" to scroll the entire web page.
   */
  containerSelector: null,

  // –––––––––––––– Performance Tuning
  /*
   * how much extra room to keep visible and invisible on
   * either side of the viewport.
   */
  bufferSize: 1,

  // –––––––––––––– Initial Scroll State
  /*
   *  If set, this will be used to set
   *  the scroll position at which the
   *  component initially renders.
   */
  scrollPosition: 0,

  /*
   * If set, upon initialization the scroll
   * position will be set such that the item
   * with the provided id is at the top left
   * on screen.
   *
   * If the item cannot be found, scrollTop
   * is set to 0.
   */
  idForFirstItem: null,

  indexForFirstItem: 0,

  /*
   * If set, if scrollPosition is empty
   * at initialization, the component will
   * render starting at the bottom.
   */
  renderFromLast: false,

  // –––––––––––––– @private

  _minHeight: computed('minHeight', function() {
    const minHeight = this.get('minHeight');

    if (typeof minHeight === 'string') {
      return estimateElementHeight(this.element, minHeight);
    } else {
      return minHeight;
    }
  }),

  token: null,

  _scrollTop: 0,
  _virtualComponents: null,
  _orderedComponents: null,

  schedule(queueName, job) {
    return scheduler.schedule(queueName, job, this.token);
  },

  _scheduleSendActions() {
    if (!this._nextSendAction) {
      this._nextSendAction = this.schedule('affect', () => {
        this._nextSendAction = null;

        const { length } = this._actionsToSend;

        for (let i = 0; i < length; i++) {
          this.sendAction(this._actionsToSend[i]);
        }

        this._actionsToSend.length = 0;
      });
    }
  },

  sendActionOnce(action) {
    this._actionsToSend.push(action);
    this._scheduleSendActions();
  },

  /*
   * Schedules an update for the next RAF
   *
   * This will first run _updateVirtualComponents in the sync phase, which figures out what
   * components need to be rerendered and updates the appropriate VCs and moves their associated
   * DOM. At the end of the `sync` phase the runloop is flushed and Glimmer renders the changes.
   *
   * After that, it remeausures all of the rendered components and adjusts the scrollTop and padding
   * if the heights of the components were not what we expected.
   *
   * @private
   */
  _scheduleUpdate() {
    if (!this._nextUpdate) {
      this._nextUpdate = this.schedule('sync', () => {
        this._nextUpdate = null;
        this._updateVirtualComponents();
      });
    }

    if (!this._nextMeasure) {
      this._nextMeasure = this.schedule('affect', () => {
        this._nextMeasure = null;
        this._adjustRender();
      });
    }
  },

  /*
   * Update the VirtualComponents state based on current scroll position
   *
   * @private
   */
  _updateVirtualComponents() {
    const {
      _items,
      _scrollTop,
      _containerHeight,
      _prevFirstItemIndex,
      _orderedComponents
    } = this;

    const visibleTop = _scrollTop;
    const visibleBottom = _scrollTop + _containerHeight;

    // Get the current bounds based on number of VCs and visible boundaries
    const {
      firstItemIndex,
      lastItemIndex,
      firstVisibleIndex,
      lastVisibleIndex,
      totalBefore,
      totalAfter
    } = this.geometryManager.getBounds(_orderedComponents.length, visibleTop, visibleBottom);

    // itemDelta is the number of items we've changed since last, render, could be greater than the
    // number of VCs. offsetAmount is the number of VCs we want to shift from front to back or back
    // to front, which will necessarily be less than the number of VCs.
    const itemDelta = firstItemIndex - _prevFirstItemIndex;
    const offsetAmount = Math.abs(itemDelta % _orderedComponents.length);

    if (itemDelta < 0) {
      // Scrolling up
      let movedComponents = _orderedComponents.splice(-offsetAmount);
      _orderedComponents.unshift(...movedComponents);

      this._moveDOM(movedComponents[0], movedComponents[movedComponents.length - 1], true);
    } else if (itemDelta > 0) {
      // Scrolling down
      let movedComponents = _orderedComponents.splice(0, offsetAmount);
      _orderedComponents.push(...movedComponents);

      this._moveDOM(movedComponents[0], movedComponents[movedComponents.length - 1], false);
    }

    for (let i = 0, itemIndex = firstItemIndex; itemIndex <= lastItemIndex; i++, itemIndex++) {
      this.recycleVirtualComponent(_orderedComponents[i], _items[itemIndex], itemIndex);
    }

    if (itemDelta !== 0) {
      if (firstItemIndex === 0) {
        this.sendActionOnce('firstReached');
      }

      if (lastItemIndex === _items.length - 1) {
        this.sendActionOnce('lastReached');
      }

      if (firstVisibleIndex === 0) {
        this.sendActionOnce('firstVisibleReached');
      }

      if (lastVisibleIndex === _items.length - 1) {
        this.sendActionOnce('lastVisibleReached');
      }
    }

    this._totalBefore = totalBefore;
    this._totalAfter = totalAfter;

    this._prevFirstItemIndex = firstItemIndex;
    this._firstVisibleIndex = firstVisibleIndex;
  },

  // VirtualComponent DOM is extracted by using a Range that begins at the first component to be
  // moved and ends at the last. Glimmer's bindings allow us to extract the contents and move them,
  // even before they are rendered.
  _moveDOM(firstComponent, lastComponent, prepend) {
    const rangeToMove = new Range();

    rangeToMove.setStart(firstComponent._upperBound, 0);
    rangeToMove.setEnd(lastComponent._lowerBound, 0);

    const docFragment = rangeToMove.extractContents();

    firstComponent._upperBound = docFragment.firstChild || firstComponent._upperBound;
    lastComponent._lowerBound = docFragment.lastChild || lastComponent._lowerBound;

    if (prepend) {
      this._virtualComponentAttacher.prepend(docFragment);
    } else {
      this._virtualComponentAttacher.appendChild(docFragment);
    }
  },

  _adjustRender() {
    const { _orderedComponents, _firstVisibleIndex } = this;

    const {
      deltaBefore,
      deltaAfter,
      deltaScroll
    } = this.geometryManager.remeasure(_orderedComponents, _firstVisibleIndex);


    if (deltaScroll !== 0) {
      this._container.scrollTop += deltaScroll;
    }

    this._virtualComponentAttacher.style.paddingTop = `${this._totalBefore + deltaBefore}px`;
    this._virtualComponentAttacher.style.paddingBottom = `${this._totalAfter + deltaAfter}px`;
  },

  recycleVirtualComponent(component, newContent, newIndex, newHeight) {
    debugOnError(`You cannot set an item's content to undefined`, newContent);
    debugOnError(`You cannot recycle components other than a VirtualComponent`, component instanceof VirtualComponent);

    component.clientRect = null;
    set(component, 'index', newIndex);

    if (component.content !== newContent) {
      set(component, 'content', newContent);
    }
  },

  /*
   * Sets up _virtualComponents, which is meant to be a static pool of components that we render to.
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

  _updateVirtualComponentPool() {
    const _virtualComponents = this.get('_virtualComponents');
    const minHeight = this.get('_minHeight');
    const bufferSize = this.get('bufferSize');
    const { _orderedComponents } = this;

    const containerHeight = this._containerHeight;
    const bufferHeight = containerHeight * bufferSize;
    const containerWithBuffers = containerHeight + (bufferHeight * 2);

    // The total number of components is determined by the minimum number required to span the
    // container with its buffers. Combined with the above rendering strategy this fairly
    // performant, even if mean item size is above the minimum.
    const totalComponents = Math.min(this.get('items.length'), Math.ceil(containerWithBuffers / minHeight) + 1);
    const componentsToAdd = totalComponents - _virtualComponents.length;

    let i, component;

    for (i = 0; i < componentsToAdd; i++) {
      component = new VirtualComponent(this.token);
      set(component, 'content', {});
      _virtualComponents.pushObject(component);
    }

    _orderedComponents.length = totalComponents;

    for (i = 0; i < totalComponents; i++) {
      _orderedComponents[i] = _virtualComponents[i];
    }

    this.schedule('sync', () => {
      this._moveDOM(_orderedComponents[0], _orderedComponents[_orderedComponents.length - 1]);
    });
  },

  didUpdateAttrs() {
    const { geometryManager, keyList, _items } = this;
    const newItems = getArray(this.get('items'));
    const minHeight = this.get('_minHeight');
    const key = this.get('key');

    const lenDiff = newItems.length - _items.length;

    if (keyList.canPrepend(newItems)) {
      keyList.prepend(newItems);
      geometryManager.prepend(lenDiff);

      // When items are prepended we have to move the current scroll position downward by the amount
      // added by the new items, and add to the prevFirstItemIndex to get an accurate itemDelta
      this.schedule('sync', () => {
        this._prevFirstItemIndex += lenDiff;
        this._scrollTop += lenDiff * minHeight;
        this._cachedTop = this._scrollTop;
        this._lastEarthquake = this._scrollTop;
        this._container.scrollTop = this._scrollTop;
      });
    } else if (this.keyList.canAppend(newItems)) {
      keyList.append(newItems);
      geometryManager.append(lenDiff);
    } else {
      this.keyList = new LazyKeyList(newItems, key);
      this.geometryManager = new GeometryManager(newItems.length, minHeight);
    }

    this._items = newItems;
    this._scheduleUpdate();
  },

  // –––––––––––––– Setup/Teardown
  didInsertElement() {
    const key = this.get('key');
    const items = getArray(this.get('items'));

    this.keyList = new LazyKeyList(items, key);
    this.geometryManager = new GeometryManager(items.length, this.get('_minHeight'));
    this._items = items;

    // The container element needs to have some height in order for us to set the scroll position
    // on initiliaziation, so we set this min-height property to the known minimum height
    this.element.style.minHeight = `${this.geometryManager.skipList.total}px`;

    this._virtualComponentRenderer = this.element.getElementsByClassName('virtual-component-renderer')[0];
    this._virtualComponentAttacher = this.element.getElementsByClassName('virtual-component-attacher')[0];

    // The rendered {{each}} is removed from the DOM, but a reference is kept, allowing Glimmer to
    // continue rendering to the node. This enables the manual diffing strategy described above.
    this.element.removeChild(this._virtualComponentRenderer);

    const containerSelector = this.get('containerSelector');

    // standard _scrollTop doesn't allow for negative values. In the case where the scroll container
    // is the window, anytime the viewport is above the collection we would like to capture that assert
    // a negative value
    if (containerSelector === 'body') {
      this._container = Container;
      this._scrollTop = this._container.scrollTop - this.element.getBoundingClientRect().top;
    } else {
      this._container = containerSelector ? closestElement(containerSelector) : this.element.parentNode;
    }

    this._containerHeight = this._container.offsetHeight;

    // Initialize the component pool, set the scroll state, and schedule the first update
    this._updateVirtualComponentPool();
    this._initializeScrollState();
    this._scheduleUpdate();

    this._scrollHandler = () => {
      let top = this._container.scrollTop;
      let dY = top - this._cachedTop;
      this._scrollTop += dY;
      this._cachedTop = top;

      if (this._isEarthquake()) {
        this._scheduleUpdate();
      }
    };

    this._resizeHandler = () => {
      this._containerHeight = this._container.offsetHeight;
      this._updateVirtualComponentPool();
      this._scheduleUpdate();
    };

    addScrollHandler(this._container, this._scrollHandler);
    this._container.addEventListener('resize', this._resizeHandler);

    console.timeEnd('vertical-collection-init');
  },

  _isEarthquake() {
    if (Math.abs(this._lastEarthquake - this._scrollTop) > this.get('_minHeight') / 2) {
      this._lastEarthquake = this._scrollTop;

      return true;
    }

    return false;
  },

  _initializeScrollState() {
    this._lastEarthquake = 0;

    const idForFirstItem = this.get('idForFirstItem');
    const indexForFirstItem = this.get('indexForFirstItem');
    const minHeight = this.get('_minHeight');
    const renderFromLast = this.get('renderFromLast');
    const maxIndex = this._items.length;

    let index = indexForFirstItem;

    // if (idForFirstItem) {
    //   if (!this.keyIndexMap) {
    //     this._constructKeyIndexMap;
    //   }

    //   index = this.keyIndexMap[idForFirstItem];
    // }

    // if (renderFromLast) {
    //   index = maxIndex;
    // }

    if (index > 0) {
      this._scrollTop = Math.min(index * minHeight, (maxIndex * minHeight) - this._containerHeight);

      this._container.scrollTop = this._scrollTop;
    }

    this._cachedTop = this._container.scrollTop;
  },

  willDestroy() {
    removeScrollHandler(this._container, this._scrollHandler);

    this._container.removeEventListener('resize', this._resizeHandler);

    this.token.cancel();
  },

  init() {
    console.time('vertical-collection-init');
    this._super();

    this.set('_virtualComponents', A());
    this._orderedComponents = [];
    this._actionsToSend = [];
    this.token = new Token();
  }
});

VerticalCollection.reopenClass({
  positionalParams: ['items']
});

export default VerticalCollection;
