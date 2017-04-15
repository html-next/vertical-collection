/* global Array, Math */
import Ember from 'ember';
import layout from './template';

import keyForItem from 'vertical-collection/-private/ember/utils/key-for-item';

import estimateElementHeight from 'vertical-collection/-private/utils/element/estimate-element-height';
import closestElement from 'vertical-collection/-private/utils/element/closest';

import DynamicRadar from 'vertical-collection/-private/data-view/radar/dynamic-radar';
import StaticRadar from 'vertical-collection/-private/data-view/radar/static-radar';

import Container from 'vertical-collection/-private/data-view/container';
import objectAt from 'vertical-collection/-private/data-view/utils/object-at';
import {
  addScrollHandler,
  removeScrollHandler
} from 'vertical-collection/-private/data-view/utils/scroll-handler';

const {
  computed,
  Component,
  get,
  run,
  String: { htmlSafe },
  VERSION
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

  // –––––––––––––– Required Settings

  minHeight: 75,

  // usable via {{#vertical-collection <items-array>}}
  items: null,

  // –––––––––––––– Optional Settings
  staticHeight: false,

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

  _items: computed.or('items', 'content'),

  _minHeight: computed('minHeight', function() {
    const minHeight = this.get('minHeight');

    if (typeof minHeight === 'string') {
      return estimateElementHeight(this.element, minHeight);
    } else {
      return minHeight;
    }
  }),

  isEmpty: computed.empty('_items'),

  supportsInverse: computed(function() {
    // This is not a direct semver comparison, just a standard JS String comparison.
    // It happens to work for the cases we need to compare (since we don't support < 1.11)
    return VERSION >= '1.13.0';
  }),

  shouldYieldToInverse: computed.and('isEmpty', 'supportsInverse'),

  _sendActions() {
    const items = this.get('_items');
    const itemsLength = get(items, 'length');

    const {
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

    this._prevFirstItemIndex = firstItemIndex;
    this._prevLastItemIndex = lastItemIndex;
    this._prevFirstVisibleIndex = firstVisibleIndex;
    this._prevLastVisibleIndex = lastVisibleIndex;

    if (firstItemIndex === 0 && firstItemIndex !== _prevFirstItemIndex) {
      this.sendAction('firstReached', objectAt(items, firstItemIndex), firstItemIndex);
    }

    if (lastItemIndex === itemsLength - 1 && lastItemIndex !== _prevLastItemIndex) {
      this.sendAction('lastReached', objectAt(items, lastItemIndex), lastItemIndex);
    }

    if (firstVisibleIndex !== _prevFirstVisibleIndex) {
      this.sendAction('firstVisibleChanged', objectAt(items, firstVisibleIndex), firstVisibleIndex);
    }

    if (lastVisibleIndex !== _prevLastVisibleIndex) {
      this.sendAction('lastVisibleChanged', objectAt(items, lastVisibleIndex), lastVisibleIndex);
    }
  },

  radar: computed('items.[]', function() {
    const {
      _radar,

      _prevItemsLength,
      _prevFirstKey,
      _prevLastKey
    } = this;

    const items = this.get('_items');
    const itemsLength = get(items, 'length');

    const key = this.get('key');
    const lenDiff = itemsLength - (_prevItemsLength || 0);

    if (itemsLength > 0) {
      this._prevItemsLength = itemsLength;
      this._prevFirstKey = keyForItem(objectAt(items, 0), key, 0);
      this._prevLastKey = keyForItem(objectAt(items, itemsLength - 1), key, itemsLength - 1);
    } else {
      this._prevItemsLength = this._prevFirstKey = this._prevLastKey = null;
    }

    if (isPrepend(lenDiff, items, key, _prevFirstKey, _prevLastKey)) {
      this._prevFirstItemIndex += lenDiff;
      this._prevFirstVisibleIndex += lenDiff;

      _radar.prepend(items, lenDiff);
    } else if (isAppend(lenDiff, items, key, _prevFirstKey, _prevLastKey)) {
      _radar.append(items, lenDiff);
    } else if (!isSameArray(lenDiff, items, key, _prevFirstKey, _prevLastKey)) {
      _radar.resetItems(items);
    }

    return this._radar;
  }),

  didUpdateAttrs() {
    this._initializeRadar();
  },

  // –––––––––––––– Setup/Teardown
  didInsertElement() {
    const containerSelector = this.get('containerSelector');

    if (containerSelector === 'body') {
      this._scrollContainer = Container;
    } else {
      this._scrollContainer = containerSelector ? closestElement(this.element.parentNode, containerSelector) : this.element.parentNode;
    }

    // Initialize the Radar and set the scroll state
    this._initializeRadar();
    this._initializeScrollState();
    this._initializeEventHandlers();

    console.timeEnd('vertical-collection-init'); // eslint-disable-line no-console
  },

  _isEarthquake(top) {
    if (Math.abs(this._lastEarthquake - top) > this.get('_minHeight') / 2) {
      this._lastEarthquake = top;

      return true;
    }

    return false;
  },

  /*
   * Set all of the Radar's properties, including `items`. This is a separate function from
   * `_resetRadar` because it needs to set `items` on the Radar _after_ minHeight has been set, but
   * _before_ we update the VirtualComponentPool and schedule an update. In the normal
   *
   * @private
   */
  _initializeRadar() {
    const minHeight = this.get('_minHeight');
    const bufferSize = this.get('bufferSize');
    const renderFromLast = this.get('renderFromLast');

    const {
      element,
      _scrollContainer
    } = this;

    this._radar.init(element, _scrollContainer, minHeight, bufferSize, renderFromLast);
  },

  _initializeScrollState() {
    let scrollPosition = this.get('scrollPosition');

    const renderFromLast = this.get('renderFromLast');
    const idForFirstItem = this.get('idForFirstItem');
    const key = this.get('key');

    const minHeight = this.get('_minHeight');
    const items = this.get('_items');
    const maxIndex = get(items, 'length') - 1;

    let index = 0;

    if (idForFirstItem) {
      for (let i = 0; i < maxIndex; i++) {
        if (keyForItem(objectAt(items, i), key, i) == idForFirstItem) {
          index = i;
          break;
        }
      }

      scrollPosition = index * minHeight;
    } else if (renderFromLast) {
      // If no id was set and `renderFromLast` is true, start from the bottom
      scrollPosition = maxIndex * minHeight;
    }

    if (renderFromLast) {
      scrollPosition -= (this._radar.scrollContainerHeight - minHeight);
    }

    // The container element needs to have some height in order for us to set the scroll position
    // on initialization, so we set this min-height property to radar's total
    this.element.style.minHeight = `${this._radar.total}px`;

    this._radar.visibleTop = scrollPosition;

    this._scrollContainer.scrollTop = this._radar.scrollTop;
    this._lastEarthquake = this._radar.scrollTop;
  },

  _initializeEventHandlers() {
    this._scrollHandler = ({ top }) => {
      if (this._isEarthquake(top)) {
        this._radar.scheduleUpdate();
      }
    };

    this._resizeHandler = () => {
      this._initializeRadar();
    };

    addScrollHandler(this._scrollContainer, this._scrollHandler);
    Container.addEventListener('resize', this._resizeHandler);
  },

  willDestroy() {
    this._radar.destroy();
    run.cancel(this._nextSendActions);

    removeScrollHandler(this._scrollContainer, this._scrollHandler);
    Container.removeEventListener('resize', this._resizeHandler);
  },

  init() {
    console.time('vertical-collection-init'); // eslint-disable-line no-console
    this._super();

    const RadarClass = this.get('staticHeight') ? StaticRadar : DynamicRadar;

    this._radar = new RadarClass();

    this._radar.didUpdate = () => {
      this._nextSendActions = run.schedule('afterRender', () => this._sendActions());
    };
  }
});

VerticalCollection.reopenClass({
  positionalParams: ['items']
});

function isPrepend(lenDiff, newItems, key, oldFirstKey, oldLastKey) {
  const newItemsLength = get(newItems, 'length');

  if (lenDiff <= 0 || lenDiff >= newItemsLength || newItemsLength === 0) {
    return false;
  }

  const newFirstKey = keyForItem(objectAt(newItems, lenDiff), key, lenDiff);
  const newLastKey = keyForItem(objectAt(newItems, newItemsLength - 1), key, newItemsLength - 1);

  return oldFirstKey === newFirstKey && oldLastKey === newLastKey;
}

function isAppend(lenDiff, newItems, key, oldFirstKey, oldLastKey) {
  const newItemsLength = get(newItems, 'length');

  if (lenDiff <= 0 || lenDiff >= newItemsLength || newItemsLength === 0) {
    return false;
  }

  const newFirstKey = keyForItem(objectAt(newItems, 0), key, 0);
  const newLastKey = keyForItem(objectAt(newItems, newItemsLength - lenDiff - 1), key, newItemsLength - lenDiff - 1);

  return oldFirstKey === newFirstKey && oldLastKey === newLastKey;
}

function isSameArray(lenDiff, newItems, key, oldFirstKey, oldLastKey) {
  const newItemsLength = get(newItems, 'length');

  if (lenDiff !== 0 || newItemsLength === 0) {
    return false;
  }

  const newFirstKey = keyForItem(objectAt(newItems, 0), key, 0);
  const newLastKey = keyForItem(objectAt(newItems, newItemsLength - 1), key, newItemsLength - 1);

  return oldFirstKey === newFirstKey && oldLastKey === newLastKey;
}

export default VerticalCollection;
