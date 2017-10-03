/* global Array, Math */
import Ember from 'ember';
import layout from './template';

import { SUPPORTS_INVERSE_BLOCK } from 'ember-compatibility-helpers';

import {
  keyForItem,
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

  /**
   * Property name used for storing references to each item in items. Accessing this attribute for each item
   * should yield a unique result for every item in the list.
   * 
   * @property key
   * @type String
   * @default '@identity'
   */
  key: '@identity',

  // –––––––––––––– Required Settings

  /**
   * Estimated height of an item to be rendered. Use best guess as this will be used to determine how many items
   * are displayed virtually, before and after the vertical-collection viewport.
   *
   * @property estimateHeight
   * @type Number
   * @required
   */
  estimateHeight: null,

  /**
   * List of objects to svelte-render.
   * Can be called like `{{#vertical-collection <items-array>}}`, since it's the first positional parameter of this component.
   *
   * @property items
   * @type Array
   * @required
   */
  items: null,

  // –––––––––––––– Optional Settings
  /**
   * Indicates if this component's height will change after initial render.
   * If true, item tracking will be done using the StaticRadar, otherwise the DynamicRadar.
   * @property staticHeight
   * @type Boolean
   */
  staticHeight: false,

  /**
   * Indicates whether or not list items in the Radar should be reused on update of virtual components (e.g. scroll).
   * This yields performance benefits because it is not necessary to repopulate the component pool of the radar.
   * // WHEN WOULD WE WANT TO SET THIS TO FALSE?
   * @property shouldRecycle
   * @type Boolean
   */
  shouldRecycle: true,

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
  /**
   * The amount of extra room in pixels to keep visible and invisible on
   * either side of the viewport. This value needs to be greater than 0.
   *
   * @property bufferSize
   * @type Number
   * @default 1
   */
  bufferSize: 1,

  // –––––––––––––– Initial Scroll State
  /**
   * If set, upon initialization the scroll
   * position will be set such that the item
   * with the provided id is at the top left
   * on screen.
   *
   * If the item cannot be found, scrollTop
   * is set to 0.
   * @property idForFirstItem
   */
  idForFirstItem: null,

  /**
   * If set, if scrollPosition is empty
   * at initialization, the component will
   * render starting at the bottom.
   * @property renderFromLast
   * @type Boolean
   * @default false
   */
  renderFromLast: false,

  /**
   * If set to true, the collection will render all of the items passed into the component.
   * This counteracts the performance benefits of using vertical collection, but allows for improved accessibility,
   * since the high performance of vertical-collection is attributed to rendering only the visible elements of a list,
   * which is not a viable solution in a screen-reader environment, for example.
   *
   * @property renderAll
   * @type Boolean
   * @default false
   */
  renderAll: false,

  isEmpty: computed.empty('items'),
  shouldYieldToInverse: computed.readOnly('isEmpty'),

  virtualComponents: computed('items.[]', 'renderAll', 'estimateHeight', 'bufferSize', function() {
    const {
      _radar,
      _prevItemsLength,
      _prevFirstKey,
      _prevLastKey
    } = this;

    _radar.estimateHeight = this.get('estimateHeight');
    _radar.renderAll = this.get('renderAll');
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
    } else {
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
      if (Math.abs(this._lastEarthquake - top) > this._radar._estimateHeight / 2) {
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

    if (this._scrollHandler) {
      removeScrollHandler(this._scrollContainer, this._scrollHandler);
    }
    if (this._resizeHandler) {
      Container.removeEventListener('resize', this._resizeHandler);
    }
  },

  init() {
    this._super();

    this.token = new Token();
    const RadarClass = this.staticHeight ? StaticRadar : DynamicRadar;

    const items = this.get('items') || [];

    const idForFirstItem = this.get('idForFirstItem');
    const initialRenderCount = this.get('initialRenderCount');
    const key = this.get('key');
    const renderFromLast = this.get('renderFromLast');
    const shouldRecycle = this.get('shouldRecycle');

    const startingIndex = calculateStartingIndex(items, idForFirstItem, key, renderFromLast);

    this._radar = new RadarClass(this.token, items, initialRenderCount, startingIndex, shouldRecycle);
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

if (!SUPPORTS_INVERSE_BLOCK) {
  VerticalCollection.reopen({
    shouldYieldToInverse: false
  });
}

function calculateStartingIndex(items, idForFirstItem, key, renderFromLast) {
  const totalItems = get(items, 'length');

  let startingIndex = 0;

  if (idForFirstItem !== undefined && idForFirstItem !== null) {
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

export default VerticalCollection;
