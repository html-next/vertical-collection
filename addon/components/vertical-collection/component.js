/* global Array, Math */
import Ember from 'ember';
import layout from './template';
import scheduler from '../../-private/scheduler';
import estimateElementHeight from '../../-private/utils/element/estimate-element-height';
import closestElement from '../../-private/utils/element/closest';
import keyForItem from '../../-private/ember/utils/key-for-item';
import Token from '../../-private/scheduler/token';
import NumberTree from '../../-private/data-view/number-tree';
import Container from '../../-private/data-view/container';
import VirtualComponent from '../../-private/virtual-component';
import { assert, debugOnError } from 'vertical-collection/-debug/helpers';

import {
  addScrollHandler,
  removeScrollHandler
} from 'vertical-collection/-private/data-view/utils/scroll-handler';

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

  _defaultHeight: computed('defaultHeight', function() {
    let defaultHeight = this.get('defaultHeight');

    if (typeof defaultHeight === 'number') {
      defaultHeight = `${defaultHeight}px`;
    }

    return defaultHeight;
  }),
  defaultItemPixelHeight: computed('defaultHeight', function() {
    return estimateElementHeight(this.element, this.get('defaultHeight'));
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
    const arrayLength = this.get('items.length');

    this.heightTree = new NumberTree(arrayLength, this.get('minHeight'));

    this._itemsInserted = false;
  },

  _updateVirtualComponentPool() {
    const _virtualComponents = this.get('_virtualComponents');
    const minHeight = this.get('minHeight');
    const bufferSize = this.get('bufferSize');
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
    const { _changedVirtualComponents } = this;
    _changedVirtualComponents.length = 0;

    const {
      _scrollTop,
      _containerHeight,
      _topItemIndex: lastTopItemIndex,
      _bottomItemIndex: lastBottomItemIndex
    } = this;

    let currentVirtualTop = this._lastVirtualTop || 0;

    let { values: heights } = this.heightTree;

    let {
      index: middleItemIndex,
      totalBefore: heightAbove,
      totalAfter: heightBelow
    } = this.heightTree.getIndex(_scrollTop + (_containerHeight / 2));

    let i, length, topItemIndex, bottomItemIndex, firstVisibleIndex, slice, itemIndex, scrollIsForward;

    topItemIndex = bottomItemIndex = middleItemIndex;

    // Middle out algorithm :P
    while (true) {
      if (bottomItemIndex < heights.length) {
        heightBelow -= heights[bottomItemIndex];
        bottomItemIndex++;
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

    if (topItemIndex < lastTopItemIndex) {
      scrollIsForward = false;

      slice = this.get('items').slice(topItemIndex, lastTopItemIndex);
      itemIndex = lastTopItemIndex;

      for (i = slice.length - 1; i >= 0; i--) {
        if (currentVirtualTop === 0) {
          currentVirtualTop = _virtualComponents.length;
        }

        currentVirtualTop--;
        itemIndex--;

        this.recycleVirtualComponent(_virtualComponents[currentVirtualTop], slice[i], itemIndex, heights[itemIndex]);
        _changedVirtualComponents.push(_virtualComponents[currentVirtualTop]);
      }
    } else if (bottomItemIndex > lastBottomItemIndex) {
      scrollIsForward = true;

      slice = this.get('items').slice(lastBottomItemIndex, bottomItemIndex);
      itemIndex = lastBottomItemIndex;

      for (i = 0, length = slice.length; i < length; i++) {
        this.recycleVirtualComponent(_virtualComponents[currentVirtualTop], slice[i], itemIndex, heights[itemIndex]);
        _changedVirtualComponents.push(_virtualComponents[currentVirtualTop]);

        currentVirtualTop++;
        itemIndex++;

        if (currentVirtualTop === _virtualComponents.length) {
          currentVirtualTop = 0;
        }
      }
    } else if (!this._itemsInserted) {
      scrollIsForward = true;

      this._itemsInserted = true;

      slice = this.get('items').slice(topItemIndex, bottomItemIndex);
      itemIndex = topItemIndex;

      currentVirtualTop = 0;

      for (let i = 0; i < slice.length; i++) {
        this.recycleVirtualComponent(_virtualComponents[i], slice[i], itemIndex, heights[itemIndex]);
        _changedVirtualComponents.push(_virtualComponents[i]);
        itemIndex++;
      }
    }

    this._lastVirtualTop = currentVirtualTop;
    this._heightAbove = heightAbove;
    this._heightBelow = heightBelow;
    this._topItemIndex = topItemIndex;
    this._bottomItemIndex = bottomItemIndex;
    this._firstVisibleIndex = firstVisibleIndex;
    this._scrollIsForward = scrollIsForward;
  },

  _renderChanges() {
    const {
      _changedVirtualComponents,
      _scrollIsForward,
      _firstVisibleIndex
    } = this;

    let i, length, height, index, virtualComponent;

    let heightBefore = 0;
    let heightAfter = 0;

    for (i = 0, length = _changedVirtualComponents.length; i < length; i++) {
      virtualComponent = _changedVirtualComponents[i];

      if (virtualComponent.hasClone) {
        virtualComponent.deleteCurrentClone();
      }

      if (_scrollIsForward) {
        this._virtualComponentAttacher.appendChild(virtualComponent.cloneContents());
      } else {
        this._virtualComponentAttacher.prepend(virtualComponent.cloneContents());
      }

      if (virtualComponent.index <= _firstVisibleIndex) {
        heightBefore += virtualComponent.height;
      }

      // This can be done only once, once NumberTree is refactored into SkipList
      virtualComponent.updateCloneDimensions();

      height = virtualComponent.height;
      index = virtualComponent.index;

      this.heightTree.setIndex(index, height);

      if (virtualComponent.index <= _firstVisibleIndex) {
        heightAfter += virtualComponent.height;
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

    set(component, 'content', newContent);
    set(component, 'index', newIndex);
    set(component, 'height', newHeight);
  },

  // –––––––––––––– Setup/Teardown
  didInsertElement() {
    if (document.readyState === 'complete') {
      this._setupElement();
    } else {
      this._loadHandler = this._setupElement.bind(this);
      window.addEventListener('load', this._loadHandler);
    }
  },

  _setupElement() {
    this.element.style.minHeight = `${this.heightTree.total}px`;

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
    if (Math.abs(this._lastEarthquake - this._scrollTop) > this.get('minHeight') / 2) {
      this._lastEarthquake = this._scrollTop;

      return true;
    }

    return false;
  },

  _initializeScrollState() {
    this._lastEarthquake = 0;

    const idForFirstItem = this.get('idForFirstItem');
    const indexForFirstItem = this.get('indexForFirstItem');
    const minHeight = this.get('minHeight');

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

    if (this._loadHandler) {
      window.removeEventListener('load', this._loadHandler);
    }

    this.token.cancel();
  },

  init() {
    console.time('vertical-collection-init');
    this._super();

    this.set('_virtualComponents', A());
    this._changedVirtualComponents = [];
    this.token = new Token();
  }
});

VerticalCollection.reopenClass({
  positionalParams: ['items']
});

export default VerticalCollection;
