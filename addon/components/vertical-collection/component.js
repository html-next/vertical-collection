/* global Array, Math */
import Ember from 'ember';
import layout from './template';

import scheduler from '../../-private/scheduler';
import Token from '../../-private/scheduler/token';

import estimateElementHeight from '../../-private/utils/element/estimate-element-height';
import closestElement from '../../-private/utils/element/closest';

import SkipList from '../../-private/data-view/skip-list';
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
    const { heightList, keyList } = this;

    if (heightList && keyList) {
      const items = this.items = getArray(this.get('items'));
      const minHeight = this.get('_minHeight');
      const key = this.get('key');
      let newHeightList;

      if (keyList.canPrepend(items)) {
        keyList.prepend(items);

        const { values: prevHeights } = heightList;

        const buffer = new ArrayBuffer(items.length * 4);
        const newHeights = new Uint32Array(buffer);

        const lenDiff = items.length - prevHeights.length;

        this.schedule('sync', () => {
          this._scrollTop += lenDiff * minHeight;
          this._cachedTop = this._scrollTop;
          this._container.scrollTop = this._scrollTop;
          this._lastEarthquake = this._scrollTop;

          this._topItemIndex += lenDiff;
          this._bottomItemIndex += lenDiff;
        });

        newHeights.set(prevHeights, lenDiff);
        newHeights.fill(minHeight, 0, lenDiff);

        newHeightList = new SkipList(newHeights);
      } else if (this.keyList.canAppend(items)) {
        keyList.append(items);

        const { values: prevHeights } = heightList;

        const buffer = new ArrayBuffer(items.length * 4);
        const newHeights = new Uint32Array(buffer);

        newHeights.set(prevHeights);
        newHeights.fill(minHeight, prevHeights.length);

        newHeightList = new SkipList(newHeights);
      } else {
        this._itemsInserted = false;

        this.keyList = new LazyKeyList(items, key);
        newHeightList = new SkipList(items.length, minHeight);
      }

      this.heightList = newHeightList;
      this._scheduleUpdate();
    }

    this._topItemIndexReached = false;
    this._bottomItemIndexReached = false;
    this._firstVisibleReached = false;
    this._lastVisibleReached = false;
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
    const _virtualComponents = this.get('_virtualComponents');
    const { _orderedComponents } = this;

    const {
      _scrollTop,
      _containerHeight,
      _topItemIndex: lastTopItemIndex,
      _bottomItemIndex: lastBottomItemIndex
    } = this;

    const { values: heights, total: totalHeight } = this.heightList;

    const maxIndex = heights.length - 1;

    let currentVirtualTop = this._currentVirtualTop || 0;

    let {
      index: middleItemIndex,
      totalBefore: heightAbove,
      totalAfter: heightBelow
    } = this.heightList.get(_scrollTop + (_containerHeight / 2));

    let i,
      length,
      topItemIndex,
      bottomItemIndex,
      firstVisibleIndex,
      lastVisibleIndex,
      slice,
      itemIndex,
      scrollIsForward;

    topItemIndex = bottomItemIndex = middleItemIndex;

    // Middle out algorithm :P
    while (true) {
      if (bottomItemIndex < maxIndex) {
        heightBelow -= heights[bottomItemIndex];
        bottomItemIndex++;

        if (!lastVisibleIndex && totalHeight - heightBelow >= _scrollTop + _containerHeight) {
          lastVisibleIndex = bottomItemIndex - 1;
        }
      }

      if (bottomItemIndex - topItemIndex === _virtualComponents.length) {
        break;
      }

      if (topItemIndex > 0) {
        topItemIndex--;
        heightAbove -= heights[topItemIndex];

        if (!firstVisibleIndex && heightAbove < _scrollTop) {
          firstVisibleIndex = topItemIndex;
        }
      }

      if (bottomItemIndex - topItemIndex === _virtualComponents.length) {
        break;
      }
    }

    if (topItemIndex === 0 && !this._topItemIndexReached) {
      this.sendActionOnce('firstReached');
      this._topItemIndexReached = true;
    } else if (topItemIndex !== 0) {
      this._topItemIndexReached = false;
    }

    if (bottomItemIndex === maxIndex && !this._bottomItemIndexReached) {
      this.sendActionOnce('lastReached');
      this._bottomItemIndexReached = true;
    } else if (bottomItemIndex !== maxIndex) {
      this._bottomItemIndexReached = false;
    }

    if (firstVisibleIndex === 0 && !this._firstVisibleReached) {
      this.sendActionOnce('firstVisibleReached');
      this._firstVisibleReached = true;
    } else if (firstVisibleIndex !== 0) {
      this._firstVisibleReached = false;
    }

    if (lastVisibleIndex === maxIndex && !this._lastVisibleReached) {
      this.sendActionOnce('lastVisibleReached');
      this._lastVisibleReached = true;
    } else if (lastVisibleIndex !== maxIndex) {
      this._lastVisibleReached = false;
    }

    slice = this.items.slice(topItemIndex, bottomItemIndex);
    let movedComponents;

    itemIndex = topItemIndex;

    let offsetAmount = Math.abs(topItemIndex - lastTopItemIndex) % _virtualComponents.length;

    if (topItemIndex < lastTopItemIndex) {
      scrollIsForward = false;

      movedComponents = _orderedComponents.splice(-offsetAmount);
      _orderedComponents.unshift(...movedComponents);
    } else if (bottomItemIndex > lastBottomItemIndex) {
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

    for (i = 0, length = slice.length; i < length; i++) {
      this.recycleVirtualComponent(_orderedComponents[i], slice[i], itemIndex, heights[itemIndex]);
      itemIndex++;
    }

    this._movedComponents = movedComponents;

    this._currentVirtualTop = currentVirtualTop;

    this._heightAbove = heightAbove;
    this._heightBelow = heightBelow;

    this._topItemIndex = topItemIndex;
    this._bottomItemIndex = bottomItemIndex;
    this._firstVisibleIndex = firstVisibleIndex;
    this._lastVisibleIndex = lastVisibleIndex;

    this._scrollIsForward = scrollIsForward;
  },

  _renderChanges() {
    const {
      keyList,
      _virtualComponents,
      _scrollIsForward,
      _firstVisibleIndex,
      _movedComponents
    } = this;

    let i, length, height, index, virtualComponent;

    let heightBefore = 0;
    let heightAfter = 0;

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

    for (i = 0, length = _virtualComponents.length; i < length; i++) {
      virtualComponent = _virtualComponents[i];

      // We only need to remeasure immediately if we're scrolling backwards, maybe we can defer this
      if (!keyList.hasKeyFor(virtualComponent.index)) {
        keyList.get(virtualComponent.index);

        if (virtualComponent.index <= _firstVisibleIndex) {
          heightBefore += virtualComponent.height;
        }

        virtualComponent.updateDimensions();

        height = virtualComponent.height;
        index = virtualComponent.index;

        this.heightList.set(index, height);

        if (virtualComponent.index <= _firstVisibleIndex) {
          heightAfter += virtualComponent.height;
        }
      }
    }

    if (heightBefore !== heightAfter) {
      this._container.scrollTop += heightAfter - heightBefore;
    }

    this._virtualComponentAttacher.style.paddingTop = `${this._heightAbove}px`;
    this._virtualComponentAttacher.style.paddingBottom = `${this._heightBelow}px`;
  },

  recycleVirtualComponent(component, newContent, newIndex, newHeight) {
    debugOnError(`You cannot set an item's content to undefined`, newContent);
    debugOnError(`You cannot recycle components other than a VirtualComponent`, component instanceof VirtualComponent);

    if (get(component, 'content') !== newContent) {
      set(component, 'content', newContent);
      set(component, 'index', newIndex);
      set(component, 'height', newHeight);
    }
  },

  // –––––––––––––– Setup/Teardown
  didInsertElement() {
    const { items } = this;
    const key = this.get('key');
    this.keyList = new LazyKeyList(items, key);
    this.heightList = new SkipList(items.length, this.get('_minHeight'));

    this._itemsInserted = false;
    this.element.style.minHeight = `${this.heightList.total}px`;

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
