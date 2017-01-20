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
  attributeBindings: ['boxStyle:style'],
  boxStyle: htmlSafe(''),

  key: '@identity',
  content: computed.deprecatingAlias('items'),

  // –––––––––––––– Required Settings

  defaultHeight: 75,

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
  bufferSize: 0.1,

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

    this.heightTree = new NumberTree(arrayLength, this.get('defaultHeight'));

  },

  _scheduleUpdate() {
    if (this._isPrepending) {
      return;
    }
    this._updateChildStates();
  },

  didRender() {
    const rendered = this._virtualComponents;
    let oldHeight = this._heightAbove;
    let newHeight = this._heightAbove;
    let indexBeforeViewport = 0;

    while (oldHeight < this._scrollTop) {
      oldHeight += rendered[indexBeforeViewport].height;
      indexBeforeViewport++;
    }

    if (!this._nextUpdateHeights) {
      this._nextUpdateHeights = this.schedule('measure', () => {
        this._nextUpdateHeights = null;
        let i, l, height, index;

        for (i = 0, l = rendered.length; i < l; i++) {
          rendered[i].updateDimensions();

          height = rendered[i].height;
          index = rendered[i].index;

          this.heightTree.setIndex(index, height);

          if (i < indexBeforeViewport) {
            newHeight += height;
          }
        }

        if (newHeight !== oldHeight) {
          this._silentNight(newHeight - oldHeight);
        }
      });
    }
  },

  _silentNight(dY) {
    if (!this._nextSilentNight) {
      this._nextSilentNight = this.schedule('affect', () => {
        this._nextSilentNight = null;
        this._container.scrollTop += dY;
      });
    }
  },

  recycleVirtualComponent(component, newContent, newIndex, newHeight) {
    debugOnError(`You cannot set an item's content to undefined`, newContent);
    debugOnError(`You cannot recycle components other than a VirtualComponent`, component instanceof VirtualComponent);

    set(component, 'content', newContent);
    set(component, 'index', newIndex);
    set(component, 'height', newHeight);
  },

  // updateActiveItems: function(inbound) {
  //   const outbound = this._virtualComponents;

  //   if (!inbound || !inbound.length) {
  //     outbound.length = 0;
  //     return outbound;
  //   }

  //   for (let i = 0; i < inbound.length; i++) {
  //     outbound[i] = outbound[i] || new VirtualComponent(this.token);
  //     this.recycleVirtualComponent(outbound[i], inbound[i], i);
  //   }
  //   // this.notifyPropertyChange('length');

  //   this.set('activeItems', outbound);
  //   this.notifyPropertyChange('activeItems');
  // },

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
    // if (this._isFirstRender) {

    //   this._initialRenderCount -= 1;
    //   this.satellites._activeCount += 1;
    //   this.updateActiveItems(this.satellites.slice(10));
    //   this._currentSlice = {
    //     start: 0,
    //     end: this.satellites._activeCount,
    //     lengthDelta: lenDiff
    //   };

    //   let { heightAbove, heightBelow } = this.satellites;

    //   this.set('boxStyle', htmlSafe(`padding-top: ${heightAbove}px; padding-bottom: ${heightBelow}px;`));

    //   this.schedule('affect', () => {
    //     this.radar.rebuild();

    //     if (this.element.parentNode.scrollTop !== heightAbove) {
    //       this.element.parentNode.scrollTop = heightAbove;
    //       this.satellites.shift(heightAbove, 0);
    //     }

    //     if (this._initialRenderCount <= 0) {
    //       this._isFirstRender = false;

    //       return;
    //     }

    //     this._scheduleUpdate();
    //   });
    //   return;
    // }

    // const { edges, _scrollIsForward } = this.radar;
    // const { ordered } = this.satellites;
    const { _virtualComponents, _scrollIsForward } = this;

    const currentUpperBound = this._scrollTop;
    const containerHeight = this._container.offsetHeight;
    const currentLowerBound = currentUpperBound + containerHeight;

    const bufferSize = this.get('bufferSize');

    let { values: heights, total: totalHeight } = this.heightTree;

    const bufferedTop = Math.max(currentUpperBound - (bufferSize * containerHeight), 0);
    const bufferedBottom = Math.min(currentLowerBound + (bufferSize * containerHeight), totalHeight);

    let {
      index: topItemIndex,
      totalBefore: heightAbove,
      totalAfter: heightBelow
    } = this.heightTree.getIndex(bufferedTop);

    let bottomItemIndex = topItemIndex;
    let bottomItemBottom = heightAbove;

    while (bottomItemIndex < heights.length && bottomItemBottom < bufferedBottom) {
      bottomItemBottom += heights[bottomItemIndex];
      heightBelow -= heights[bottomItemIndex];
      bottomItemIndex++;
    }

    let len = bottomItemIndex - topItemIndex;
    let curProxyLen = _virtualComponents.length;
    let lenDiff = len - curProxyLen;
    let altered;
    let cachedSlice = this._currentSlice;
    let newSlice = {
      start: topItemIndex,
      end: bottomItemIndex,
      lengthDelta: lenDiff
    };
    this._currentSlice = newSlice;

    // console.log(
    //   '\tTotal Length:\t' + ordered.length + '\n' +
    //   '\tCurrent Active Length:\t' + curProxyLen + '\n' +
    //   '\tNew Active Length: \t' + len + '\n' +
    //   '\tLength Delta:\t' + lenDiff + '\n' +
    //   '\t---------------------------------------------\n' +
    //   '\tOld Start Index:\t' + cachedSlice.start + '\n' +
    //   '\tOld End Index:\t\t' + cachedSlice.end + '\n' +
    //   '\tNew Start Index:\t' + newSlice.start + '\n' +
    //   '\tNew End Index:\t\t' + newSlice.end + '\n'
    // );

    if (lenDiff < 0) {
      let absDiff = -1 * lenDiff;
      let newLength = len;

      if (_scrollIsForward) {
        //console.log('would remove ' + absDiff + ' active items from use from the top');
        // console.log(absDiff, lenDiff, len);
        altered = _virtualComponents.splice(0, absDiff);
        /*
        console.log('topItemIndex - absDiff < 0', topItemIndex, absDiff);
        if (topItemIndex - newLength < 0) {
          // we are bounded to the beginning of the proxy array
          // and maintain at requisite length
          //
          topItemIndex = 0;
          bottomItemIndex = newLength;
        } else {
          topItemIndex -= absDiff;
        }
        */
      } else {
        // console.log('would remove ' + absDiff + ' active items from use from the bottom');
        altered = _virtualComponents.splice(len, absDiff);
        /*
        if (bottomItemIndex + absDiff > maxIndex) {
          // topItemIndex = maxIndex - n;
          // bottomItemIndex = maxIndex;
        } else {
          // bottomItemIndex += absDiff;
        }
        */
      }

      altered.forEach((p) => { p.destroy(); });

      lenDiff = 0;
      assert(`We got to the right length`, _virtualComponents.length === len);
    } else if (lenDiff > 0) {
      // console.log('adding ' + lenDiff + ' active items');
      altered = new Array(lenDiff);

      for (let i = 0; i < lenDiff; i++) {
        altered[i] = new VirtualComponent(this.token);
        altered[i].position = curProxyLen + i;
      }
      if (_scrollIsForward) {
        // console.log('adding to bottom');
        _virtualComponents.splice(_virtualComponents.length, 0, ...altered);
      } else {
        // console.log('adding to top');
        _virtualComponents.splice(0, 0, ...altered);
      }
    }

    let _slice = this.get('items').slice(topItemIndex, bottomItemIndex);

    debugOnError(`slice is the expected length`, _slice.length === _virtualComponents.length);

    for (let i = 0; i < _slice.length; i++) {
      let heightIndex = topItemIndex + i;
      this.recycleVirtualComponent(_virtualComponents[i], _slice[i], heightIndex, heights[heightIndex]);
    }

    this.set('activeItems', _virtualComponents);
    this.notifyPropertyChange('activeItems');

    this._heightAbove = heightAbove;
    this._heightBelow = heightBelow;

    this.set('boxStyle', htmlSafe(`padding-top: ${heightAbove}px; padding-bottom: ${heightBelow}px;`));
  },

  // –––––––––––––– Setup/Teardown
  didInsertElement() {
    const containerSelector = this.get('containerSelector');

    if (containerSelector === 'body') {
      this._container = Container;
      this._scrollTop = this.element.getBoundingClientRect().top;
    } else {
      this._container = containerSelector ? closestElement(containerSelector) : this.element.parentNode;
    }

    this._initializeScrollState();
    this._scheduleUpdate();

    this._cachedTop = 0;
    this._scrollHandler = ({ top }) => {
      let dY = top - this._cachedTop;
      this._scrollIsForward = dY > 0;
      this._scrollTop += dY;
      this._cachedTop = top;

      if (this._isEarthquake(top)) {
        this._updateChildStates();
      }
    };

    addScrollHandler(this._container, this._scrollHandler);

    console.timeEnd('vertical-collection-init');
  },

  _isEarthquake() {
    if (Math.abs(this._lastEarthquake - this._scrollTop) > 10) {
      this._lastEarthquake = this._scrollTop;

      return true;
    }

    return false;
  },

  _initializeScrollState() {
    this._lastEarthquake = this._scrollTop;

    const retainScrollPosition = this.get('retainScrollPosition');
    const idForFirstItem = this.get('idForFirstItem');
    const indexForFirstItem = this.get('indexForFirstItem');
    const defaultHeight = this.get('defaultHeight');

    if (!retainScrollPosition) {
      let index = indexForFirstItem;

      if (idForFirstItem) {
        if (!this.keyIndexMap) {
          this._constructKeyIndexMap;
        }

        index = this.keyIndexMap[idForFirstItem];
      }

      this._scrollTop = index * defaultHeight;
    }

    this.schedule('affect', () => {
      this._container.scrollTop = this._scrollTop;
    });
  },

  willDestroy() {
    removeScrollHandler(this._container, this._scrollHandler);
    //this.token.cancelled = true;
  },

  init() {
    console.time('vertical-collection-init');
    this._super();

    this._virtualComponents = A();
    this.token = new Token();
  }
});

VerticalCollection.reopenClass({
  positionalParams: ['items']
});

export default VerticalCollection;
