/* global Array, Math */
import Ember from 'ember';
import layout from './template';

import {
  keyForItem,
  SUPPORTS_INVERSE_BLOCK,
  estimateElementHeight,
  closestElement,
  DynamicRadar,
  StaticRadar,
  Container,
  objectAt,
  addScrollHandler,
  removeScrollHandler
} from '../../-private';

import { assert, stripInProduction } from 'vertical-collection/-debug/helpers';

const {
  computed,
  Component,
  get,
  run
} = Ember;

const VerticalCollection = Component.extend({
  layout,

  tagName: 'vertical-collection',

  key: '@identity',

  // –––––––––––––– Required Settings

  minHeight: null,

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
  bufferSize: 0,

  // –––––––––––––– Initial Scroll State
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

  _calculateMinHeight() {
    const { minHeight } = this;

    assert('Must provide a `minHeight` value to vertical-collection', minHeight !== null);

    if (typeof minHeight === 'string') {
      return estimateElementHeight(this.element, minHeight);
    } else {
      return minHeight;
    }
  },

  supportsInverse: SUPPORTS_INVERSE_BLOCK,

  isEmpty: computed.empty('items'),
  shouldYieldToInverse: computed.and('isEmpty', 'supportsInverse'),

  radar: computed('items.[]', function() {
    const {
      _radar,

      _prevItemsLength,
      _prevFirstKey,
      _prevLastKey
    } = this;

    const items = this.get('items');
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

    // TODO add explicit test
    if (isPrepend(lenDiff, items, key, _prevFirstKey, _prevLastKey)) {
      _radar.prepend(items, lenDiff);
      // TODO add explicit test
    } else if (isAppend(lenDiff, items, key, _prevFirstKey, _prevLastKey)) {
      _radar.append(items, lenDiff);
    } else {
      const isReset = !isSameArray(lenDiff, items, key, _prevFirstKey, _prevLastKey);
      _radar.updateItems(items, isReset);
    }

    return this._radar;
  }),

  _scheduleSendAction(action, index) {
    this._scheduledActions.push([action, index]);

    if (this._nextSendActions === null) {
      this._nextSendActions = setTimeout(() => {
        this._nextSendActions = null;

        run(() => {
          const items = this.get('_items');
          const keyPath = this.get('key');

          this._scheduledActions.forEach(([action, index]) => {
            const item = objectAt(items, index);
            const key = keyForItem(item, keyPath, index);

            this.sendAction(action, item, index, key);
          });
          this._scheduledActions.length = 0;
        });
      });
    }
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
  },

  /*
   * Set all of the Radar's base properties.
   *
   * @private
   */
  _initializeRadar() {
    const minHeight = this._minHeight;
    const bufferSize = this.get('bufferSize');
    const renderFromLast = this.get('renderFromLast');
    const keyProperty = this.get('key');

    const {
      element,
      _scrollContainer
    } = this;

    this._radar.init(element, _scrollContainer, minHeight, bufferSize, renderFromLast, keyProperty);
  },

  _initializeScrollState() {
    const renderFromLast = this.get('renderFromLast');
    const idForFirstItem = this.get('idForFirstItem');
    const key = this.get('key');

    const minHeight = this._minHeight;
    const items = this.get('items');
    const totalItems = get(items, 'length');

    let visibleTop = 0;

    // TODO add explicit test
    if (idForFirstItem) {
      for (let i = 0; i < totalItems - 1; i++) {
        // TODO strict equality
        if (keyForItem(objectAt(items, i), key, i) == idForFirstItem) {
          visibleTop = i * minHeight;
          break;
        }
      }

      // TODO add explicit test
    } else if (renderFromLast) {
      // If no id was set and `renderFromLast` is true, start from the bottom
      visibleTop = (totalItems - 1) * minHeight;
    }

    // TODO add explicit test
    if (renderFromLast) {
      visibleTop -= (this._radar.scrollContainerHeight - minHeight);
    }

    // The container element needs to have some height in order for us to set the scroll position
    // on initialization, so we set this min-height property to radar's total
    this.element.style.minHeight = `${minHeight * totalItems}px`;

    visibleTop -= this._radar.scrollTopOffset;

    this._radar.visibleTop = visibleTop;
  },

  _initializeEventHandlers() {
    this._lastEarthquake = this._radar.scrollTop;

    this._scrollHandler = ({ top }) => {
      if (Math.abs(this._lastEarthquake - top) > this._minHeight / 2) {
        this._radar.scheduleUpdate();
        this._lastEarthquake = top;
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
    clearTimeout(this._nextSendActions);

    removeScrollHandler(this._scrollContainer, this._scrollHandler);
    Container.removeEventListener('resize', this._resizeHandler);
  },

  init() {
    this._super();

    this._minHeight = this._calculateMinHeight();
    const RadarClass = this.get('staticHeight') ? StaticRadar : DynamicRadar;

    this._radar = new RadarClass();

    this._hasAction = null;
    this._scheduledActions = [];
    this._nextSendActions = null;

    let a = !!this.lastReached;
    let b = !!this.firstReached;
    let c = !!this.lastVisibleChanged;
    let d = !!this.firstVisibleChanged;
    let any = a || b || c || d;

    if (any) {
      this._hasAction = {
        lastReached: a,
        firstReached: b,
        lastVisibleChanged: c,
        firstVisibleChanged: d
      };

      this._radar.sendAction = (action, index) => {
        if (this._hasAction[action]) {
          this._scheduleSendAction(action, index);
        }
      };
    }

    stripInProduction(() => {
      Object.freeze(this);
    });
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
