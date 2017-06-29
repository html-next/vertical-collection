/* global Array, Math */
import Ember from 'ember';
import layout from './template';

import {
  keyForItem,
  SUPPORTS_INVERSE_BLOCK,
  closestElement,
  DynamicRadar,
  StaticRadar,
  Container,
  objectAt,
  addScrollHandler,
  removeScrollHandler,
  Token,
  scheduler
} from '../../-private';

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

  isEmpty: computed.empty('items'),
  shouldYieldToInverse: computed.and('isEmpty', 'supportsInverse'),

  virtualComponents: computed('items.[]', 'minHeight', 'bufferSize', function() {
    const {
      _radar,
      _prevItemsLength,
      _prevFirstKey,
      _prevLastKey
    } = this;

    _radar.minHeight = this.get('minHeight');
    _radar.bufferSize = this.get('bufferSize');

    const items = this.get('items');
    const itemsLength = get(items, 'length');

    if (items === null || items === undefined || itemsLength === 0) {
      _radar.items = [];
      _radar.reset();
      _radar.scheduleUpdate();

      this._prevItemsLength = this._prevFirstKey = this._prevLastKey = 0;

      return _radar.virtualComponents;
    }

    _radar.items = items;

    const key = this.get('key');
    const lenDiff = itemsLength - _prevItemsLength;

    this._prevItemsLength = itemsLength;
    this._prevFirstKey = keyForItem(objectAt(items, 0), key, 0);
    this._prevLastKey = keyForItem(objectAt(items, itemsLength - 1), key, itemsLength - 1);

    if (isPrepend(lenDiff, items, key, _prevFirstKey, _prevLastKey) === true) {
      _radar.prepend(lenDiff);
    } else if (isAppend(lenDiff, items, key, _prevFirstKey, _prevLastKey) === true) {
      _radar.append(lenDiff);
    } else if (isSameArray(lenDiff, items, key, _prevFirstKey, _prevLastKey) === false) {
      _radar.reset();
    }

    _radar.scheduleUpdate();

    return _radar.virtualComponents;
  }),

  schedule(queueName, job) {
    return scheduler.schedule(queueName, job, this.token);
  },

  _scheduleSendAction(action, index) {
    this._scheduledActions.push([action, index]);

    if (this._nextSendActions === null) {
      this._nextSendActions = setTimeout(() => {
        this._nextSendActions = null;

        run(() => {
          const items = this.get('items');
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
    this._radar.itemContainer = this.element;
    this._radar.scrollContainer = this._scrollContainer;

    this.schedule('sync', () => {
      this._initializeEventHandlers();
      this._radar.start();
    });
  },

  _initializeEventHandlers() {
    this._scrollHandler = ({ top }) => {
      if (Math.abs(this._lastEarthquake - top) > this._radar._minHeight / 2) {
        this._radar.scheduleUpdate();
        this._lastEarthquake = top;
      }
    };

    this._resizeHandler = () => {
      this._radar.scheduleUpdate();
    };

    addScrollHandler(this._scrollContainer, this._scrollHandler);
    Container.addEventListener('resize', this._resizeHandler);
  },

  willDestroy() {
    this.token.cancel();
    this._radar.destroy();
    clearTimeout(this._nextSendActions);

    removeScrollHandler(this._scrollContainer, this._scrollHandler);
    Container.removeEventListener('resize', this._resizeHandler);
  },

  init() {
    this._super();

    this.token = new Token();
    const RadarClass = this.staticHeight ? StaticRadar : DynamicRadar;

    const items = this.get('items') || [];
    const initialRenderCount = this.get('initialRenderCount');
    const renderFromLast = this.get('renderFromLast');
    const idForFirstItem = this.get('idForFirstItem');
    const key = this.get('key');

    const startingIndex = calculateStartingIndex(items, idForFirstItem, key, renderFromLast);

    this._radar = new RadarClass(this.token, items, initialRenderCount, startingIndex);
    this._radar.renderFromLast = renderFromLast;

    this.supportsInverse = SUPPORTS_INVERSE_BLOCK;
    this._prevItemsLength = 0;
    this._prevFirstKey = null;
    this._prevLastKey = null;
    this._lastEarthquake = 0;
    this._scrollContainer = null;
    this._scrollHandler = null;
    this._resizeHandler = null;

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
  }
});

VerticalCollection.reopenClass({
  positionalParams: ['items']
});

function calculateStartingIndex(items, idForFirstItem, key, renderFromLast) {
  const totalItems = get(items, 'length');

  let startingIndex = 0;

  if (idForFirstItem !== undefined) {
    for (let i = 0; i < totalItems; i++) {
      if (keyForItem(objectAt(items, i), key, i) === idForFirstItem) {
        startingIndex = i;
        break;
      }
    }
  } else if (renderFromLast === true) {
    // If no id was set and `renderFromLast` is true, start from the bottom
    startingIndex = totalItems - 1;
  }

  return startingIndex;
}

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
