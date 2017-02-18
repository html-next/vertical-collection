/* global Array, Math */
import Ember from 'ember';
import layout from './template';

import scheduler from '../../-private/scheduler';
import Token from '../../-private/scheduler/token';
import keyForItem from '../../-private/ember/utils/key-for-item';

import estimateElementHeight from '../../-private/utils/element/estimate-element-height';
import closestElement from '../../-private/utils/element/closest';

import GeometryManager from '../../-private/data-view/geometry-manager';
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

        for (let i = 0; i < length; i += 2) {
          this.sendAction(this._actionsToSend[i], ...this._actionsToSend[i + 1]);
        }

        this._actionsToSend.length = 0;
      });
    }
  },

  sendActionOnce(action, ...args) {
    this._actionsToSend.push(action, args);
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
      this._nextMeasure = this.schedule('measure', () => {
        this._nextMeasure = null;
        this._measure();
      });
    }

    if (!this._nextAdjustRender) {
      this._nextAdjustRender = this.schedule('affect', () => {
        this._nextAdjustRender = null;
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
      _visibleTop,
      _containerHeight,
      _prevFirstItemIndex,
      _orderedComponents
    } = this;

    const visibleTop = _visibleTop;
    const visibleBottom = _visibleTop + _containerHeight;

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

    if (offsetAmount > 0) {
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
    }

    for (let i = 0, itemIndex = firstItemIndex; itemIndex <= lastItemIndex; i++, itemIndex++) {
      this.recycleVirtualComponent(_orderedComponents[i], _items[itemIndex], itemIndex);
    }

    this._totalBefore = totalBefore;
    this._totalAfter = totalAfter;

    this._firstItemIndex = firstItemIndex;
    this._lastItemIndex = lastItemIndex;

    this._firstVisibleIndex = firstVisibleIndex;
    this._lastVisibleIndex = lastVisibleIndex;
  },

  // VirtualComponent DOM is extracted by using a Range that begins at the first component to be
  // moved and ends at the last. Glimmer's bindings allow us to extract the contents and move them,
  // even before they are rendered.
  _moveDOM(firstComponent, lastComponent, prepend) {
    const rangeToMove = new Range();

    rangeToMove.setStart(firstComponent._upperBound, 0);
    rangeToMove.setEnd(lastComponent._lowerBound, 0);

    const docFragment = rangeToMove.extractContents();

    // The first and last nodes in the range do not get extracted, and are instead cloned, so they
    // have to be reset.
    //
    // NOTE: Ember 1.11 - there are cases where docFragment is null (they haven't been rendered yet.)
    firstComponent._upperBound = docFragment.firstChild || firstComponent._upperBound;
    lastComponent._lowerBound = docFragment.lastChild || lastComponent._lowerBound;

    if (prepend) {
      this._virtualComponentAttacher.prepend(docFragment);
    } else {
      this._virtualComponentAttacher.appendChild(docFragment);
    }
  },

  _measure() {
    const {
      _visibleTop,
      _containerHeight,
      _orderedComponents,
      _firstVisibleIndex,
      _lastVisibleIndex
    } = this;

    const renderFromLast = this.get('renderFromLast');
    const staticVisibleIndex = renderFromLast ? _lastVisibleIndex + 1 : _firstVisibleIndex;

    const {
      deltaBefore,
      deltaAfter,
      deltaScroll
    } = this.geometryManager.remeasure(_orderedComponents, staticVisibleIndex);

    this._visibleTop += deltaScroll;
    this._totalBefore += deltaBefore;
    this._totalAfter += deltaAfter;

    // Get the current bounds based on number of VCs and visible boundaries
    const {
      firstVisibleIndex,
      lastVisibleIndex
    } = this.geometryManager.getBounds(
      _orderedComponents.length,
      _visibleTop,
      _visibleTop + _containerHeight
    );

    this._firstVisibleIndex = firstVisibleIndex;
    this._lastVisibleIndex = lastVisibleIndex;
  },

  _adjustRender() {
    const {
      _items,

      _totalBefore,
      _totalAfter,
      _firstItemIndex,
      _lastItemIndex,
      _firstVisibleIndex,
      _lastVisibleIndex,

      _prevFirstItemIndex,
      _prevLastItemIndex,
      _prevFirstVisibleIndex,
      _prevLastVisibleIndex
    } = this;

    if (_firstItemIndex === 0 && _firstItemIndex !== _prevFirstItemIndex) {
      this.sendActionOnce('firstReached');
    }

    if (_lastItemIndex === _items.length - 1 && _lastItemIndex !== _prevLastItemIndex) {
      this.sendActionOnce('lastReached');
    }

    if (_firstVisibleIndex !== _prevFirstVisibleIndex) {
      this.sendActionOnce('firstVisibleChanged', _items[_firstVisibleIndex], _firstVisibleIndex);
    }

    if (_lastVisibleIndex !== _prevLastVisibleIndex) {
      this.sendActionOnce('lastVisibleChanged', _items[_lastVisibleIndex], _lastVisibleIndex);
    }

    // Fix for Chrome bug, sometimes scrolltop get's screwy and needs to be reset
    this._resetScrollTop();

    this._virtualComponentAttacher.style.paddingTop = `${_totalBefore}px`;
    this._virtualComponentAttacher.style.paddingBottom = `${_totalAfter}px`;

    this._prevFirstItemIndex = _firstItemIndex;
    this._prevLastItemIndex = _lastItemIndex;
    this._prevFirstVisibleIndex = _firstVisibleIndex;
    this._prevLastVisibleIndex = _lastVisibleIndex;
  },

  recycleVirtualComponent(component, newContent, newIndex) {
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

    const delta = totalComponents - _virtualComponents.length;

    let i, component;

    if (delta > 0) {
      for (i = 0; i < delta; i++) {
        component = new VirtualComponent(this.token);
        set(component, 'content', {});
        _virtualComponents.pushObject(component);
      }
    } else {
      for (i = 0; i > delta; i--) {
        _virtualComponents[i].destroy;
      }
    }

    _virtualComponents.length = totalComponents;
    _orderedComponents.length = totalComponents;

    for (i = 0; i < totalComponents; i++) {
      _orderedComponents[i] = _virtualComponents[i];
    }

    if (totalComponents > 0) {
      this.schedule('sync', () => {
        this._moveDOM(_orderedComponents[0], _orderedComponents[_orderedComponents.length - 1]);
      });
    }
  },

  _isPrepend(oldItems, newItems) {
    const lenDiff = newItems.length - oldItems.length;

    if (lenDiff <= 0) {
      return false;
    }

    const key = this.get('key');

    const oldFirstKey = keyForItem(oldItems[0], key, 0);
    const oldLastKey = keyForItem(oldItems[oldItems.length - 1], key, oldItems.length - 1);
    const newFirstKey = keyForItem(newItems[lenDiff], key, lenDiff);
    const newLastKey = keyForItem(newItems[newItems.length - 1], key, newItems.length - 1);

    return oldFirstKey === newFirstKey && oldLastKey === newLastKey;
  },

  _isAppend(oldItems, newItems) {
    const lenDiff = newItems.length - oldItems.length;

    if (lenDiff <= 0) {
      return false;
    }

    const key = this.get('key');

    const oldFirstKey = keyForItem(oldItems[0], key, 0);
    const oldLastKey = keyForItem(oldItems[oldItems.length - 1], key, oldItems.length - 1);
    const newFirstKey = keyForItem(newItems[0], key, 0);
    const newLastKey = keyForItem(newItems[newItems.length - lenDiff - 1], key, newItems.length - lenDiff - 1);

    return oldFirstKey === newFirstKey && oldLastKey === newLastKey;
  },

  didUpdateAttrs() {
    const { geometryManager, _items } = this;
    const newItems = getArray(this.get('items'));
    const minHeight = this.get('_minHeight');

    const lenDiff = newItems.length - _items.length;

    if (this._isPrepend(_items, newItems)) {
      geometryManager.prepend(lenDiff);

      // When items are prepended we have to move the current scroll position downward by the amount
      // added by the new items, and add to the prevFirstItemIndex to get an accurate itemDelta
      this.schedule('sync', () => {
        this._prevFirstItemIndex += lenDiff;
        this._visibleTop += lenDiff * minHeight;
        this._resetScrollTop();
      });
    } else if (this._isAppend(_items, newItems)) {
      geometryManager.append(lenDiff);
    } else {
      this.geometryManager = new GeometryManager(newItems.length, minHeight);
    }

    this._items = newItems;
    this._scheduleUpdate();
  },

  // –––––––––––––– Setup/Teardown
  didInsertElement() {
    const items = getArray(this.get('items'));

    this.geometryManager = new GeometryManager(items.length, this.get('_minHeight'));
    this._items = items;

    // The container element needs to have some height in order for us to set the scroll position
    // on initiliaziation, so we set this min-height property to the known minimum height
    // this.element.style.minHeight = `${this.geometryManager.skipList.total}px`;

    this._virtualComponentRenderer = this.element.getElementsByClassName('virtual-component-renderer')[0];
    this._virtualComponentAttacher = this.element.getElementsByClassName('virtual-component-attacher')[0];

    // The rendered {{each}} is removed from the DOM, but a reference is kept, allowing Glimmer to
    // continue rendering to the node. This enables the manual diffing strategy described above.
    this.element.removeChild(this._virtualComponentRenderer);

    const containerSelector = this.get('containerSelector');

    // standard _scrollTop doesn't allow for negative values. In the case where the scroll container
    // is the window, anytime the viewport is above the collection we would like to capture that as
    // a negative value
    if (containerSelector === 'body') {
      this._container = Container;
    } else {
      this._container = containerSelector ? closestElement(containerSelector) : this.element.parentNode;
    }

    this._containerHeight = this._container.offsetHeight;

    // Initialize the component pool, set the scroll state, and schedule the first update
    this._updateVirtualComponentPool();
    this._initializeScrollState();
    this._scheduleUpdate();

    this._scrollHandler = () => {
      this._visibleTop = this._container.scrollTop - this._scrollTopOffset;

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
    if (Math.abs(this._lastEarthquake - this._visibleTop) > this.get('_minHeight') / 2) {
      this._lastEarthquake = this._visibleTop;

      return true;
    }

    return false;
  },

  _resetScrollTop() {
    this._lastEarthquake = this._visibleTop;
    this._container.scrollTop = this._visibleTop + this._scrollTopOffset;
  },

  _initializeScrollState() {
    this._visibleTop = 0;
    this._lastEarthquake = 0;

    // Generally, visibleTop === container.scrollTop. However, if the container is larger than the
    // collection, this may not be the case (ex: Window is the container). In this case, we can say
    // that the visibleTop === container.scrollTop + offset, where offset is some constant distance.
    const containerOffset = this.element.getBoundingClientRect().top - this._container.getBoundingClientRect().top;
    this._scrollTopOffset = this._container.scrollTop + containerOffset;

    const renderFromLast = this.get('renderFromLast');
    const idForFirstItem = this.get('idForFirstItem');
    const key = this.get('key');

    const minHeight = this.get('_minHeight');
    const items = this._items;
    const maxIndex = items.length;

    let index;

    if (idForFirstItem) {
      for (let i = 0; i < maxIndex; i++) {
        if (keyForItem(items[i], key, i) === idForFirstItem) {
          index = i;
          break;
        }
      }

      assert(`id not found: ${idForFirstItem}`, typeof index === 'number');

      this._visibleTop = index * minHeight;

      if (renderFromLast) {
        this._visibleTop -= this._containerHeight;
      }
    }

    if (this._visibleTop > 0) {
      this._visibleTop = Math.min(this._visibleTop, (maxIndex * minHeight) - this._containerHeight);

      this._resetScrollTop();
    }
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
