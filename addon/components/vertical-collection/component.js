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
  _initialRenderCount: 10,
  _isPrepending: false,

  token: null,

  indexForFirstItem: 0,

  _scrollIsForward: false,
  _scrollTop: 0,
  _virtualComponents: null,

  _nextUpdateHeights: null,
  _nextSilentNight: null,

  schedule(queueName, job) {
    return scheduler.schedule(queueName, job, this.token);
  },

  didReceiveAttrs() {
    const arrayLength = this.get('items.length');

    this.heightTree = new NumberTree(arrayLength, this.get('minHeight'));

  },

  _scheduleUpdate() {
    this._updateChildStates();

    if (!this._nextUpdate) {
      this._nextUpdate = this.schedule('affect', () => {
        this._virtualComponentAttacher.style.top = `${this._heightAbove}px`;
        // this._virtualComponentAttacher.style.paddingBottom = `${this._heightBelow}px`;
        this._nextUpdate = null;
        // this._virtualComponentAttacher.innerHTML = '';
        // let i;
        // const components = this.get('_virtualComponents');
        // for (i = 0; i < components.length; i++) {
        //   components[i].updateBounds();
        //   this._virtualComponentAttacher.appendChild(components[i].range.cloneContents());
        //   components[i].range.detach();
        // }
      });
    }
  },

  didRender() {

  },

  _silentNight(dY) {
    if (!this._nextSilentNight) {
      this._nextSilentNight = this.schedule('affect', () => {
        this._nextSilentNight = null;
        this._container.scrollTop += dY;
      });
    }
  },

  _updateVirtualComponents() {
    const components = this.get('_virtualComponents');
    const minHeight = this.get('minHeight');
    const bufferSize = this.get('bufferSize');
    const containerHeight = this._containerHeight = this._container.offsetHeight;
    const bufferHeight = this._bufferHeight = containerHeight * bufferSize;
    const containerWithBuffers = containerHeight + (bufferHeight * 2);

    const totalComponents = Math.min(this.get('items.length'), Math.ceil(containerWithBuffers / minHeight) + 1);
    const componentsToAdd = totalComponents - components.length;

    let i, component;

    for (i = 0; i < componentsToAdd; i++) {
      component = new VirtualComponent(this.token);
      set(component, 'content', {});
      components.pushObject(component);
    }

    this.schedule('affect', () => {
      let i;
      for (i = 0; i < components.length; i++) {
        components[i].updateBounds();
        this._virtualComponentAttacher.appendChild(components[i].range.extractContents());
        components[i].range.detach();
      }
    });
  },

  recycleVirtualComponent(component, newContent, newIndex, newHeight) {
    debugOnError(`You cannot set an item's content to undefined`, newContent);
    debugOnError(`You cannot recycle components other than a VirtualComponent`, component instanceof VirtualComponent);

    set(component, 'content', newContent);
    set(component, 'index', newIndex);
    set(component, 'height', newHeight);
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
  _currentSlice: null,
  _updateChildStates() {
    const _virtualComponents = this.get('_virtualComponents');

    const {
      _scrollTop,
      _containerHeight
    } = this;

    let { values: heights } = this.heightTree;

    let {
      index: middleItemIndex,
      totalBefore: heightAbove,
      totalAfter: heightBelow
    } = this.heightTree.getIndex(_scrollTop + (_containerHeight / 2));

    let topItemIndex, bottomItemIndex;

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
      }

      if (bottomItemIndex - topItemIndex === _virtualComponents.length) {
        break;
      }
    }

    let _slice = this.get('items').slice(topItemIndex, bottomItemIndex);

    for (let i = 0; i < _slice.length; i++) {
      let heightIndex = topItemIndex + i;
      this.recycleVirtualComponent(_virtualComponents[i], _slice[i], heightIndex, heights[heightIndex]);
    }

    this._heightAbove = heightAbove;
    this._heightBelow = heightBelow;




    // if (!this._nextUpdateHeights) {
    //   this._nextUpdateHeights = this.schedule('measure', () => {
    //     this._nextUpdateHeights = null;
    //     let i, l, height, index;

    //     for (i = 0, l = rendered.length; i < l; i++) {
    //       rendered[i].updateDimensions();

    //       height = rendered[i].height;
    //       index = rendered[i].index;

    //       console.log(height, index);

    //       this.heightTree.setIndex(index, height);

    //       if (i < indexBeforeViewport) {
    //         newHeight += height;
    //       }
    //     }

    //     // if (newHeight !== oldHeight) {
    //     //   this._silentNight(newHeight - oldHeight);
    //     // }
    //   });
    // }

  },

  // –––––––––––––– Setup/Teardown
  didInsertElement() {
    const containerSelector = this.get('containerSelector');
    this._virtualComponentRenderer = document.getElementById('grab-me');
    this._virtualComponentAttacher = document.getElementById('attach-me');
    this.element.removeChild(this._virtualComponentRenderer);
    this.element.style.position = 'relative';
    this._virtualComponentAttacher.style.position = 'absolute';

    if (containerSelector === 'body') {
      this._container = Container;
      this._scrollTop = this._container.scrollTop - this.element.getBoundingClientRect().top;
    } else {
      this._container = containerSelector ? closestElement(containerSelector) : this.element.parentNode;
    }

    this.element.style.height = `${this.heightTree.total}px`;

    this._updateVirtualComponents();
    this._initializeScrollState();
    this._scheduleUpdate();

    this._cachedTop = 0;
    this._scrollHandler = () => {
      let top = this._container.scrollTop;
      let dY = top - this._cachedTop;
      this._scrollIsForward = dY > 0;
      this._scrollTop += dY;
      this._cachedTop = top;

      if (this._isEarthquake()) {
        this._scheduleUpdate();
      }
    };

    addScrollHandler(this._container, this._scrollHandler);

    console.timeEnd('vertical-collection-init');
  },

  _isEarthquake() {
    this._container
    if (Math.abs(this._lastEarthquake - this._scrollTop) > 0.75 * this._bufferHeight) {
      this._lastEarthquake = this._scrollTop;

      return true;
    }

    return false;
  },

  _initializeScrollState() {
    this._lastEarthquake = 0;
  },

  willDestroy() {
    removeScrollHandler(this._container, this._scrollHandler);
    this.token.cancel();
  },

  init() {
    console.time('vertical-collection-init');
    this._super();

    this.set('_virtualComponents', A());
    this.token = new Token();
  }
});

VerticalCollection.reopenClass({
  positionalParams: ['items']
});

export default VerticalCollection;
