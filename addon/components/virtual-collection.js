/* global Array, Math */
import { empty, readOnly } from '@ember/object/computed';

import Component from '@ember/component';
import { get, computed } from '@ember/object';
import { run } from '@ember/runloop';

import { scheduler, Token } from 'ember-raf-scheduler';

import { SUPPORTS_INVERSE_BLOCK, SUPPORTS_CLOSURE_ACTIONS } from 'ember-compatibility-helpers';

import {
  keyForItem,
  DynamicRadar,
  StaticRadar,
  objectAt
} from '../-private';

const VirtualCollection = Component.extend({

  tagName: '',

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
   * Indicates if the occluded items' widths/heights will change or not.
   * If true, the virtual-collection will assume that items' heights are always equal to estimateSize;
   * this is more performant, but less flexible.
   *
   * @property staticSize
   * @type Boolean
   */
  staticSize: computed('staticHeight', 'staticWidth', 'orientation', function() {
     return this.orientation === 'horizontal' ? this.staticWidth : this.staticHeight;
  }),

  /**
   * Indicates whether or not list items in the Radar should be reused on update of virtual components (e.g. scroll).
   * This yields performance benefits because it is not necessary to repopulate the component pool of the radar.
   * Set to false when recycling a component instance has undesirable ramifications including:
   *  - When using `unbound` in a component or sub-component
   *  - When using init for instance state that differs between instances of a component or sub-component
   *      (can move to didInitAttrs to fix this)
   *  - When templates for individual items vary widely or are based on conditionals that are likely to change
   *      (i.e. would defeat any benefits of DOM recycling anyway)
   *
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
  containerSelector: '*',

  // –––––––––––––– Performance Tuning
  /**
   * The amount of extra items to keep visible on either side of the viewport -- must be greater than 0.
   * Increasing this value is useful when doing infinite scrolling and loading data from a remote service,
   * with the desire to allow records to show as the user scrolls and the backend API takes time to respond.
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
   * This counteracts the performance benefits of using vertical collection, but has several potential applications,
   * including but not limited to:
   *
   * - It allows for improved accessibility since all elements are rendered and can be picked up by a screen reader.
   * - Can be applied in SEO solutions (i.e. fastboot) where rendering every item is desirable.
   * - Can be used to respond to the keyboard input for Find (i.e. ctrl+F/cmd+F) to show all elements, which then
   *    allows the list items to be searchable
   *
   * @property renderAll
   * @type Boolean
   * @default false
   */
  renderAll: false,

  /**
   * The tag name used in DOM elements before and after the rendered list. By default, it is set to
   * 'occluded-content' to avoid any confusion with user's CSS settings. However, it could be
   * overriden to provide custom behavior (for example, in table user wants to set it to 'tr' to
   * comply with table semantics).
   */
  occlusionTagName: 'occluded-content',

  isEmpty: empty('items'),
  shouldYieldToInverse: readOnly('isEmpty'),

  virtualComponents: computed('items.[]', 'renderAll', 'estimateHeight', 'estimateWidth', 'orientation', 'bufferSize', function() {
    const { _radar } = this;

    const items = this.items;

    _radar.items = items === null || items === undefined ? [] : items;
    _radar.estimateSize = this.orientation === 'horizontal' ? this.estimateWidth : this.estimateHeight;
    _radar.renderAll = this.renderAll;
    _radar.bufferSize = this.bufferSize;

    _radar.scheduleUpdate(true);

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
          const items = this.items;
          const keyPath = this.key;

          this._scheduledActions.forEach(([action, index]) => {
            const item = objectAt(items, index);
            const key = keyForItem(item, keyPath, index);

            // this.sendAction will be deprecated in ember 4.0
            if (SUPPORTS_CLOSURE_ACTIONS) {
              const _action = get(this, action);
              if (typeof _action == 'function') {
                _action(item, index, key);
              } else if (typeof _action === 'string') {
                this.sendAction(action, item, index, key);
              }
            } else {
              this.sendAction(action, item, index, key);
            }
          });
          this._scheduledActions.length = 0;
        });
      });
    }
  },

  // –––––––––––––– Setup/Teardown
  didInsertElement() {
    this.schedule('sync', () => {
      this._radar.start();
    });
  },

  willDestroy() {
    this.token.cancel();
    this._radar.destroy();
    let registerAPI = this.registerAPI;
    if (registerAPI) {
      /* List of methods to be exposed to public should be added here */
      let publicAPI = {
        scrollToItem: this.scrollToItem.bind(this)
      };
      registerAPI(publicAPI);
    }
    clearTimeout(this._nextSendActions);
  },

  /* Public API Methods 
     @index => number
     This will return offset height of the indexed item.
  */
  scrollToItem(index) {
    const { _radar } = this;
    // Getting the offset height from Radar
    let scrollTop = _radar.getOffsetForIndex(index);
    _radar._scrollContainer.scrollTop = scrollTop;
    // To scroll exactly to specified index, we are changing the prevIndex values to specified index
    _radar._prevFirstVisibleIndex = _radar._prevFirstItemIndex = index;
    // Components will be rendered after schedule 'measure' inside 'update' method.
    // In our case, we need to focus the element after component is rendered. So passing the promise.
    return new Promise ((resolve) => {
      _radar.scheduleUpdate(false, resolve);
    });
  },

  init() {
    this._super();

    this.token = new Token();
    const RadarClass = this.staticSize ? StaticRadar : DynamicRadar;

    const items = this.items || [];

    const bufferSize = this.bufferSize;
    const containerSelector = this.containerSelector;
    const estimateSize = this.orientation === 'horizontal' ? this.estimateWidth : this.estimateHeight;
    const orientation = this.orientation === 'horizontal' ? 'horizontal' : 'vertical';
    const initialRenderCount = this.initialRenderCount;
    const renderAll = this.renderAll;
    const renderFromLast = this.renderFromLast;
    const shouldRecycle = this.shouldRecycle;
    const occlusionTagName = this.occlusionTagName;

    const idForFirstItem = this.idForFirstItem;
    const key = this.key;

    const startingIndex = calculateStartingIndex(items, idForFirstItem, key, renderFromLast);

    this._radar = new RadarClass(
      this.token,
      {
        bufferSize,
        containerSelector,
        estimateSize,
        orientation,
        initialRenderCount,
        items,
        key,
        renderAll,
        renderFromLast,
        shouldRecycle,
        startingIndex,
        occlusionTagName
      }
    );

    this._prevItemsLength = 0;
    this._prevFirstKey = null;
    this._prevLastKey = null;

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

VirtualCollection.reopenClass({
  positionalParams: ['items']
});

if (!SUPPORTS_INVERSE_BLOCK) {
  VirtualCollection.reopen({
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

export default VirtualCollection;
