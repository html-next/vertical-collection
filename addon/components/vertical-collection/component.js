/* global Array, Math */
import Ember from 'ember';
import layout from './template';

import scheduler from '../../-private/scheduler';
import Token from '../../-private/scheduler/token';
import keyForItem from '../../-private/ember/utils/key-for-item';

import estimateElementHeight from '../../-private/utils/element/estimate-element-height';
import closestElement from '../../-private/utils/element/closest';

import DynamicRadar from '../../-private/data-view/radar/dynamic-radar';
import StaticRadar from '../../-private/data-view/radar/static-radar';

import Container from '../../-private/data-view/container';
import getArray from '../../-private/data-view/utils/get-array';
import {
  addScrollHandler,
  removeScrollHandler
} from 'vertical-collection/-private/data-view/utils/scroll-handler';

import VirtualComponent from '../../-private/virtual-component';
import moveComponents from '../../-private/utils/virtual-component/move-components';

import { assert, debugOnError } from 'vertical-collection/-debug/helpers';

const {
  A,
  set,
  computed,
  observer,
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
  _scheduleUpdate() {
    if (!this._nextUpdate) {
      this._nextUpdate = this.schedule('sync', () => {
        this._nextUpdate = null;
        this._updateVirtualComponents();
      });
    }

    if (!this._nextSendActions) {
      this._nextSendActions = this.schedule('affect', () => {
        this._nextSendActions = null;
        this._sendActions();
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
      _prevFirstItemIndex,
      _orderedComponents,
      _items,
      _radar
    } = this;

    // Set the radar's scrollTop to the current value. We do this here rather than in the scroll
    // handler to avoid repeatedly updating the scroll position and all of the radar's properties.
    _radar.scrollTop = this._container.scrollTop;

    const {
      firstItemIndex,
      lastItemIndex,
      totalBefore,
      totalAfter
    } = _radar;

    // itemDelta is the number of items we've changed since last render, could be greater than the
    // number of VCs. offsetAmount is the number of VCs we want to shift from front to back or back
    // to front, which will necessarily be less than the number of VCs.
    const itemDelta = firstItemIndex - _prevFirstItemIndex;
    const offsetAmount = Math.abs(itemDelta % _orderedComponents.length);

    if (offsetAmount > 0) {
      if (itemDelta < 0) {
        // Scrolling up
        let movedComponents = _orderedComponents.splice(-offsetAmount);

        _orderedComponents[0].hasBeenMeasured = false;
        _orderedComponents.unshift(...movedComponents);

        moveComponents(this.element, movedComponents[0], movedComponents[movedComponents.length - 1], true);
      } else if (itemDelta > 0) {
        // Scrolling down
        let movedComponents = _orderedComponents.splice(0, offsetAmount);

        _orderedComponents[0].hasBeenMeasured = false;
        _orderedComponents.push(...movedComponents);

        moveComponents(this.element, movedComponents[0], movedComponents[movedComponents.length - 1], false);
      }
    }

    for (let i = 0, itemIndex = firstItemIndex; itemIndex <= lastItemIndex; i++, itemIndex++) {
      recycleVirtualComponent(_orderedComponents[i], _items[itemIndex], itemIndex);
    }

    this.element.style.paddingTop = `${totalBefore}px`;
    this.element.style.paddingBottom = `${totalAfter}px`;
  },

  _sendActions() {
    const {
      _items,

      _prevFirstItemIndex,
      _prevLastItemIndex,
      _prevFirstVisibleIndex,
      _prevLastVisibleIndex
    } = this;

    const {
      firstItemIndex,
      lastItemIndex,
      firstVisibleIndex,
      lastVisibleIndex
    } = this._radar;

    if (firstItemIndex === 0 && firstItemIndex !== _prevFirstItemIndex) {
      this.sendAction('firstReached');
    }

    if (lastItemIndex === _items.length - 1 && lastItemIndex !== _prevLastItemIndex) {
      this.sendAction('lastReached');
    }

    if (firstVisibleIndex !== _prevFirstVisibleIndex) {
      this.sendAction('firstVisibleChanged', _items[firstVisibleIndex], firstVisibleIndex);
    }

    if (lastVisibleIndex !== _prevLastVisibleIndex) {
      this.sendAction('lastVisibleChanged', _items[lastVisibleIndex], lastVisibleIndex);
    }

    this._prevFirstItemIndex = firstItemIndex;
    this._prevLastItemIndex = lastItemIndex;
    this._prevFirstVisibleIndex = firstVisibleIndex;
    this._prevLastVisibleIndex = lastVisibleIndex;
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

    const {
      _containerHeight,
      _orderedComponents,
      _items
    } = this;

    // The total number of components is determined by the minimum number required to span the
    // container with its buffers. Combined with the above rendering strategy this fairly
    // performant, even if mean item size is above the minimum.
    const totalHeight = _containerHeight + (_containerHeight * bufferSize * 2);
    const totalComponents = Math.min(_items.length, Math.ceil(totalHeight / minHeight) + 1);
    const delta = totalComponents - _virtualComponents.length;

    if (delta > 0) {
      for (let i = 0; i < delta; i++) {
        let component = new VirtualComponent(this.token);
        set(component, 'content', {});
        _virtualComponents.pushObject(component);
      }
    } else {
      for (let i = _virtualComponents.length; i > delta; i--) {
        _virtualComponents[i].destroy;
      }
    }

    _virtualComponents.length = totalComponents;
    _orderedComponents.length = totalComponents;

    for (let i = 0; i < totalComponents; i++) {
      _orderedComponents[i] = _virtualComponents[i];
    }

    if (delta > 0) {
      this.schedule('sync', () => {
        moveComponents(
          this.element,
          _orderedComponents[_orderedComponents.length - delta],
          _orderedComponents[_orderedComponents.length - 1]
        );
      });
    }
  },

  _updateRadar() {
    const {
      RadarClass,
      _radar,
      _prevItemsLength,
      _prevFirstKey,
      _prevLastKey
    } = this;

    const items = getArray(this.get('items'));
    const minHeight = this.get('_minHeight');
    const renderFromLast = this.get('renderFromLast');
    const key = this.get('key');

    const lenDiff = items.length - (_prevItemsLength || 0);

    if (isPrepend(lenDiff, items, key, _prevFirstKey, _prevLastKey)) {
      _radar.prepend(lenDiff);

      // When items are prepended we have to add to the prevFirstItemIndex to get an accurate itemDelta
      this._prevFirstItemIndex += lenDiff;
    } else if (isAppend(lenDiff, items, key, _prevFirstKey, _prevLastKey)) {
      _radar.append(lenDiff);
    } else {
      this._radar = new RadarClass({
        scrollContainer: this._container,
        itemContainer: this.element,
        itemElements: this._orderedComponents,
        totalItems: items.length,
        minValue: minHeight,
        renderFromLast,
        parentToken: this.token
      });
    }

    this._items = items;
    this._prevItemsLength = items.length;
    this._prevFirstKey = keyForItem(items[0], key, 0);
    this._prevLastKey = keyForItem(items[items.length - 1], key, items.length - 1);


    // The container element needs to have some height in order for us to set the scroll position
    // on initialization, so we set this min-height property to radar's total
    this.element.style.minHeight = `${this._radar.total}px`;

    this._scheduleUpdate();
  },

  watchItems: observer('items.length', function() {
    this._updateRadar();
  }),

  // –––––––––––––– Setup/Teardown
  didInsertElement() {
    this._virtualComponentRenderer = this.element.getElementsByClassName('virtual-component-renderer')[0];

    // The rendered {{each}} is removed from the DOM, but a reference is kept, allowing Glimmer to
    // continue rendering to the node. This enables the manual diffing strategy described above.
    this.element.removeChild(this._virtualComponentRenderer);

    const containerSelector = this.get('containerSelector');

    if (containerSelector === 'body') {
      this._container = Container;
    } else {
      this._container = containerSelector ? closestElement(containerSelector) : this.element.parentNode;
    }

    this._containerHeight = this._container.offsetHeight;

    // Initialize the component pool, set the scroll state, and schedule the first update
    this._updateRadar();
    this._updateVirtualComponentPool();
    this._initializeScrollState();

    this._scrollHandler = () => {
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
    if (Math.abs(this._lastEarthquake - this._container.scrollTop) > this.get('_minHeight') / 2) {
      this._lastEarthquake = this._container.scrollTop;

      return true;
    }

    return false;
  },

  _initializeScrollState() {
    let visibleTop = this.get('scrollPosition');

    const renderFromLast = this.get('renderFromLast');
    const idForFirstItem = this.get('idForFirstItem');
    const key = this.get('key');

    const minHeight = this.get('_minHeight');
    const items = this.get('items');
    const maxIndex = items.length;

    let index = 0;

    if (idForFirstItem) {
      for (let i = 0; i < maxIndex; i++) {
        if (keyForItem(items[i], key, i) === idForFirstItem) {
          index = i;
          break;
        }
      }

      visibleTop = index * minHeight;

      if (renderFromLast) {
        visibleTop -= this._containerHeight - minHeight;
      }
    }

    this._radar.visibleTop = visibleTop;

    this._container.scrollTop = this._radar.visibleTop;
    this._lastEarthquake = this._radar.visibleTop;
  },

  willDestroy() {
    removeScrollHandler(this._container, this._scrollHandler);

    this._container.removeEventListener('resize', this._resizeHandler);

    this.token.cancel();
  },

  init() {
    console.time('vertical-collection-init');
    this._super();

    this.RadarClass = this.get('alwaysRemeasure') ? DynamicRadar : StaticRadar;

    this.set('_virtualComponents', A());
    this._orderedComponents = [];
    this.token = new Token();
  }
});

VerticalCollection.reopenClass({
  positionalParams: ['items']
});

function recycleVirtualComponent(component, newContent, newIndex) {
  debugOnError(`You cannot set an item's content to undefined`, newContent);
  debugOnError(`You cannot recycle components other than a VirtualComponent`, component instanceof VirtualComponent);

  set(component, 'index', newIndex);
  set(component, 'rect', null);

  if (component.content !== newContent) {
    component.hasBeenMeasured = false;
    set(component, 'content', newContent);
  }
}

function isPrepend(lenDiff, newItems, key, oldFirstKey, oldLastKey) {
  if (lenDiff <= 0) {
    return false;
  }

  const newFirstKey = keyForItem(newItems[lenDiff], key, lenDiff);
  const newLastKey = keyForItem(newItems[newItems.length - 1], key, newItems.length - 1);

  return oldFirstKey === newFirstKey && oldLastKey === newLastKey;
}

function isAppend(lenDiff, newItems, key, oldFirstKey, oldLastKey) {
  if (lenDiff <= 0) {
    return false;
  }

  const newFirstKey = keyForItem(newItems[0], key, 0);
  const newLastKey = keyForItem(newItems[newItems.length - lenDiff - 1], key, newItems.length - lenDiff - 1);

  return oldFirstKey === newFirstKey && oldLastKey === newLastKey;
}

export default VerticalCollection;
