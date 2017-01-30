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
  get,
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

  _isFirstRender: true,
  _isInitializingFromLast: false,
  _firstVisibleIndex: 0,
  _isPrepending: false,

  token: null,

  indexForFirstItem: 0,

  _scrollIsForward: true,
  _scrollTop: 0,
  _virtualComponents: null,

  schedule(queueName, job) {
    return scheduler.schedule(queueName, job, this.token);
  },

  didReceiveAttrs() {
    const { geometryManager, keyList, _items } = this;

    if (geometryManager && keyList) {
      const newItems = getArray(this.get('items'));
      const lenDiff = newItems.length - _items.length;

      const minHeight = this.get('_minHeight');
      const key = this.get('key');

      if (keyList.canPrepend(newItems)) {
        keyList.prepend(newItems);
        geometryManager.prepend(lenDiff);

        this.schedule('affect', () => {
          this._scrollTop += lenDiff * minHeight;
          this._cachedTop = this._scrollTop;
          this._container.scrollTop = this._scrollTop;
          this._lastEarthquake = this._scrollTop;

          this._prevFirstItemIndex += lenDiff;
        });
      } else if (this.keyList.canAppend(newItems)) {
        keyList.append(newItems);
        geometryManager.append(lenDiff);
      } else {
        this._itemsInserted = false;

        this.keyList = new LazyKeyList(items, key);
        this.geometryManager = new GeometryManager(newItems.length, minHeight);
      }

      this._items = newItems;
      this._scheduleUpdate();
    }
  },

  _updateVirtualComponentPool() {
    const _virtualComponents = this.get('_virtualComponents');
    const minHeight = this.get('_minHeight');
    const bufferSize = this.get('bufferSize');
    const { _orderedComponents } = this;

    const containerHeight = this._containerHeight = this._container.offsetHeight;
    const bufferHeight = this._bufferHeight = containerHeight * bufferSize;
    const containerWithBuffers = containerHeight + (bufferHeight * 2);

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
  },

  _scheduleUpdate() {
    if (!this._nextUpdate) {
      this._nextUpdate = this.schedule('sync', () => {
        this._nextUpdate = null;
        this._updateVirtualComponents();
      });
    }

    if (!this._nextRender) {
      this._nextRender = this.schedule('affect', () => {
        this._nextRender = null;
        this._renderChanges();
      });
    }
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
   *
   * The big question is can we render from the bottom
   * without the bottom most item being taken off screen?
   *
   * Triggers on scroll.
   *
   * @private
   */
  _updateVirtualComponents() {
    const {
      items,
      _scrollTop,
      _containerHeight,
      _prevFirstItemIndex,
      _orderedComponents
    } = this;

    let scrollIsForward, movedComponents;

    const {
      firstItemIndex,
      lastItemIndex,
      firstVisibleIndex,
      lastVisibleIndex,
      totalBefore,
      totalAfter
    } = this.geometryManager.getBounds(_orderedComponents.length, _scrollTop, _scrollTop + _containerHeight);

    const itemDelta = firstItemIndex - _prevFirstItemIndex;
    const offsetAmount = Math.abs(itemDelta % _orderedComponents.length);

    if (itemDelta < 0) {
      scrollIsForward = false;

      movedComponents = _orderedComponents.splice(-offsetAmount);
      _orderedComponents.unshift(...movedComponents);
    } else if (itemDelta > 0) {
      scrollIsForward = true;

      movedComponents = _orderedComponents.splice(0, offsetAmount);
      _orderedComponents.push(...movedComponents);
    } else if (!this._itemsInserted) {
      scrollIsForward = true;
      this._itemsInserted = true;
      movedComponents = _orderedComponents;
    } else {
      movedComponents = [];
    }

    for (let i = 0, itemIndex = firstItemIndex; itemIndex <= lastItemIndex; i++, itemIndex++) {
      this.recycleVirtualComponent(_orderedComponents[i], items[itemIndex], itemIndex);
    }

    if (itemDelta !== 0) {
      if (firstItemIndex === 0) {
        this.sendActionOnce('firstReached');
      }

      if (lastItemIndex === items.length - 1) {
        this.sendActionOnce('lastReached');
      }

      if (firstVisibleIndex === 0) {
        this.sendActionOnce('firstVisibleReached');
      }

      if (lastVisibleIndex === items.length - 1) {
        this.sendActionOnce('lastVisibleReached');
      }
    }

    this._movedComponents = movedComponents;

    this._totalBefore = totalBefore;
    this._totalAfter = totalAfter;

    this._prevFirstItemIndex = firstItemIndex;
    this._firstVisibleIndex = firstVisibleIndex;

    this._scrollIsForward = scrollIsForward;
  },

  _renderChanges() {
    const {
      _orderedComponents,
      _scrollIsForward,
      _firstVisibleIndex,
      _movedComponents
    } = this;


    if (_movedComponents.length > 0) {
      const firstComponent = _movedComponents[0];
      const lastComponent = _movedComponents[_movedComponents.length - 1];

      const rangeToMove = new Range();

      rangeToMove.setStart(firstComponent.upperBound, 0);
      rangeToMove.setEnd(lastComponent.lowerBound, 0);

      const docFragment = rangeToMove.extractContents();

      firstComponent._upperBound = docFragment.firstChild;
      lastComponent._lowerBound = docFragment.lastChild;

      if (_scrollIsForward) {
        this._virtualComponentAttacher.appendChild(docFragment);
      } else {
        this._virtualComponentAttacher.prepend(docFragment);
      }
    }

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

    if (component.content !== newContent) {
      set(component, 'content', newContent);
      set(component, 'index', newIndex);
      set(component, 'height', newHeight);
    }
  },

  // –––––––––––––– Setup/Teardown
  didInsertElement() {
    const key = this.get('key');
    const items = getArray(this.get('items'));


    this.keyList = new LazyKeyList(items, key);
    this.geometryManager = new GeometryManager(items.length, this.get('_minHeight'));
    this._items = items;

    this._itemsInserted = false;
    this.element.style.minHeight = `${this.geometryManager.skipList.total}px`;

    const containerSelector = this.get('containerSelector');

    this._virtualComponentRenderer = this.element.getElementsByClassName('virtual-component-renderer')[0];
    this._virtualComponentAttacher = this.element.getElementsByClassName('virtual-component-attacher')[0];

    this.element.removeChild(this._virtualComponentRenderer);

    if (containerSelector === 'body') {
      this._container = Container;
      this._scrollTop = this._container.scrollTop - this.element.getBoundingClientRect().top;
    } else {
      this._container = containerSelector ? closestElement(containerSelector) : this.element.parentNode;
    }

    this._updateVirtualComponentPool();
    this._initializeScrollState();
    this._scheduleUpdate();

    this._cachedTop = this._container.scrollTop;
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
      this._itemsInserted = false;

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

    let index = indexForFirstItem;

    if (idForFirstItem) {
      if (!this.keyIndexMap) {
        this._constructKeyIndexMap;
      }

      index = this.keyIndexMap[idForFirstItem];
    }

    if (index > 0) {
      this._scrollTop = index * minHeight;

      this._container.scrollTop = this._scrollTop;
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
