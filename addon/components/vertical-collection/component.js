/* global Array, Math */
import Ember from 'ember';
import layout from './template';
import scheduler from '../../-private/scheduler';
import estimateElementHeight from '../../-private/utils/element/estimate-element-height';
import closestElement from '../../-private/utils/element/closest';
import Token from '../../-private/scheduler/token';
import List from '../../-private/data-view/list';
import VirtualComponent from '../../-private/virtual-component';
import Proxy from '../../-private/data-view/proxy';
import { assert, debugOnError } from 'vertical-collection/-debug/helpers';

const {
  A,
  get,
  set,
  computed,
  Component,
  String: { htmlSafe }
} = Ember;

function getArg(args, name) {
  return (args && args[name]) ? (args[name].value || args[name]) : undefined;
}

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
  _tracker: null,

  _proxied: null,
  _nextUpdate: null,
  _nextSync: null,
  _nextScrollSync: null,

  schedule(queueName, job) {
    return scheduler.schedule(queueName, job, this.token);
  },

  _findFirstToRender(visibleTop, scrollIsForward) {
    const { ordered } = this._tracker;
    const { _proxied } = this;

    let first = _proxied[0];
    let position = 0;
    let index = 0;

    if (first) {
      index = first.ref.index;
      let isFirst = index === 0;

      if (scrollIsForward) {
        while (index < ordered.length && ordered[index].geography.bottom < visibleTop) {
          index++;
          position++;
        }
      } else {
        while (index > 0 && ordered[index].geography.top > visibleTop) {
          index--;
          position--;
        }
      }
    }

    return { position, index };
  },

  /*
   Binary search for finding the topmost visible view when restoring
   scroll position.

   This is not the first visible item on screen, but the first
   item that will render it's content.

   @method _findFirstRenderedComponent
   @param {Number} invisibleTop The top/left of the viewport to search against
   @returns {Number} the index into childViews of the first view to render
   **/
  /*
  _findFirstRenderedComponent(visibleTop) {
    const childComponents = this.get('children');
    let maxIndex = childComponents.length - 1;
    let minIndex = 0;
    let midIndex;

    if (maxIndex < 0) {
      return 0;
    }

    while (maxIndex > minIndex) {
      midIndex = Math.floor((minIndex + maxIndex) / 2);

      // in case of not full-window scrolling
      const component = childComponents[midIndex];
      const componentBottom = component.satellite.geography.bottom;

      if (componentBottom > visibleTop) {
        maxIndex = midIndex - 1;
      } else {
        minIndex = midIndex + 1;
      }
    }

    return minIndex;
  },
  */

  didReceiveAttrs(args) {
    // const oldArray = getArg(args.oldAttrs, 'items');
    const newArray = getArg(args.newAttrs, 'items');

    this._tracker.updateList(newArray);
    this.updateActiveItems(this._tracker.slice());
    this._scheduleUpdate();
    /*
        if (this._tracker.lastUpdateWasPrepend) {
          this._nextUpdate = this.schedule('layout', () => {
            this.radar.silentNight();
            this._updateChildStates();
            this._isPrepending = false;
            this._nextUpdate = null;
          });
        } else {
          this._scheduleSync();
        }

    if (oldArray && newArray && this._changeIsPrepend(oldArray, newArray)) {
      this._isPrepending = true;
      scheduler.forget(this._nextUpdate);

      this._nextUpdate = this.schedule('layout', () => {
        this.radar.silentNight();
        this._updateChildStates();
        this._isPrepending = false;
        this._nextUpdate = null;
      });

    } else {
      if (newArray && (!oldArray || get(oldArray, 'length') <= get(newArray, 'length'))) {
        this._scheduleUpdate();
      }

      this._scheduleSync();
    }
    */
  },

  _scheduleUpdate() {
    if (this._isPrepending) {
      return;
    }
    this._updateChildStates();
    return;
    // if (this._nextUpdate === null) {
    //   this._nextUpdate = this.schedule('layout', () => {
    //     this._updateChildStates();
    //     this._nextUpdate = null;
    //   });
    // }
  },

  _scheduleSync() {
    if (this._nextSync === null) {
      this._nextSync = this.schedule('layout', () => {
        this._tracker.radar.updateSkyline();
        this._nextSync = null;
      });
    }
  },

  _scheduleScrollSync() {
    if (this._isInitializingFromLast) {
      if (this._nextScrollSync === null) {
        this._nextScrollSync = this.schedule('measure', () => {
          const last = this.element.lastElementChild;

          this._isInitializingFromLast = false;
          if (last) {
            last.scrollIntoView(false);
          }

          this._nextScrollSync = null;
        });
      }
    }
  },

  didRender() {
    const rendered = this._proxied;

    for (let i = 0, l = rendered.length; i < l; i++) {
      rendered[i].didRender();
    }
  },

  recycleVirtualComponent(component, newContent, newPosition) {
    debugOnError(`You cannot set an item's content to undefined`, newContent);
    debugOnError(`You cannot recycle components other than a VirtualComponent`, component instanceof VirtualComponent);
    debugOnError(`You cannot set an item's content to something other than a Proxy`, newContent instanceof Proxy);

    component.ref = newContent;
    set(component, 'content', newContent.ref);
    set(component, 'index', newContent.index);
    component.position = newPosition;
  },

  updateActiveItems: function(inbound) {
    const outbound = this._proxied;

    if (!inbound || !inbound.length) {
      outbound.length = 0;
      return outbound;
    }

    for (let i = 0; i < inbound.length; i++) {
      outbound[i] = outbound[i] || new VirtualComponent(this.token);
      this.recycleVirtualComponent(outbound[i], inbound[i], i);
    }
    // this.notifyPropertyChange('length');

    this.set('activeItems', outbound);
    this.notifyPropertyChange('activeItems');
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
    if (this._isFirstRender) {

      this._initialRenderCount -= 1;
      this._tracker._activeCount += 1;
      this.updateActiveItems(this._tracker.slice());
      this._currentSlice = {
        start: 0,
        end: this._tracker._activeCount,
        lengthDelta: lenDiff
      };

      let { heightAbove, heightBelow } = this._tracker;

      this.set('boxStyle', htmlSafe(`padding-top: ${heightAbove}px; padding-bottom: ${heightBelow}px;`));

      this.schedule('affect', () => {
        this._tracker.radar.rebuild();

        if (this._initialRenderCount <= 0) {
          this._isFirstRender = false;
          return;
        }

        this._scheduleUpdate();
      });
      return;
    }

    const { edges, _scrollIsForward } = this._tracker.radar;
    const { ordered } = this._tracker;
    const { _proxied } = this;
    const currentViewportBound = this._tracker.radar.skyline.top;
    let currentUpperBound = edges.bufferedTop;

    if (currentUpperBound < currentViewportBound) {
      currentUpperBound = currentViewportBound;
    }

    const { position, index } = this._findFirstToRender(currentUpperBound, _scrollIsForward);
    let topItemIndex = index;
    const maxIndex = ordered.length - 1;
    let bottomItemIndex = topItemIndex;
    let topVisibleSpotted = false;

    while (bottomItemIndex <= maxIndex) {
      const ref = ordered[bottomItemIndex];
      const itemTop = ref.geography.top;
      const itemBottom = ref.geography.bottom;

      // end the loop if we've reached the end of components we care about
      if (itemTop > edges.bufferedBottom) {
        // Add one more, just in case
        bottomItemIndex++;
        break;
      }

      // above the upper reveal boundary
      if (itemBottom < edges.bufferedTop) {
        bottomItemIndex++;
        continue;
      }

      // above the upper screen boundary
      if (itemBottom < edges.visibleTop) {
        /*
        if (bottomItemIndex === 0) {
          this.sendActionOnce('firstReached', {
            item: component,
            index: bottomItemIndex
          });
        }
        */
        bottomItemIndex++;
        continue;
      }

      // above the lower screen boundary
      if (itemTop < edges.visibleBottom) {
        /*
        if (bottomItemIndex === 0) {
          this.sendActionOnce('firstReached', {
            item: component,
            index: bottomItemIndex
          });
        }
        if (bottomItemIndex === lastIndex) {
          this.sendActionOnce('lastReached', {
            item: component,
            index: bottomItemIndex
          });
        }
        */

        if (!topVisibleSpotted) {
          topVisibleSpotted = true;

          /*
          this.set('_firstVisibleIndex', bottomItemIndex);
          this.sendActionOnce('firstVisibleChanged', {
            item: component,
            index: bottomItemIndex
          });
          */
        }

        bottomItemIndex++;
        continue;
      }

      // above the lower reveal boundary (componentTop < edges.bufferedBottom)
        /*
        if (bottomItemIndex === lastIndex) {
          this.sendActionOnce('lastReached', {
            item: component,
            index: bottomItemIndex
          });
        }
        */
      bottomItemIndex++;
    }

    /*
    this.sendActionOnce('lastVisibleChanged', {
      item: ordered[bottomItemIndex - 1],
      index: bottomItemIndex - 1
    });
    */

    // debugger;
    // this._scheduleScrollSync();

    /*
    if (this._isFirstRender) {
      this._isFirstRender = false;
      this.sendActionOnce('didMountCollection', {
        firstVisible: { item: ordered[topItemIndex], index: topItemIndex },
        lastVisible: { item: ordered[bottomItemIndex - 1], index: bottomItemIndex - 1 }
      });
    }
    */

    let len = bottomItemIndex - topItemIndex;
    let curProxyLen = _proxied.length;
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
        console.log(absDiff, lenDiff, len);
        altered = _proxied.splice(0, absDiff);
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
        console.log('would remove ' + absDiff + ' active items from use from the bottom');
        altered = _proxied.splice(len, absDiff);
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
      assert(`We got to the right length`, _proxied.length === len);
    } else if (lenDiff > 0) {
      console.log('adding ' + lenDiff + ' active items');
      altered = new Array(lenDiff);

      for (let i = 0; i < lenDiff; i++) {
        altered[i] = new VirtualComponent(this.token);
        altered[i].position = curProxyLen + i;
      }
      if (_scrollIsForward) {
        // console.log('adding to bottom');
        _proxied.splice(_proxied.length, 0, ...altered);
      } else {
        // console.log('adding to top');
        _proxied.splice(0, 0, ...altered);
      }
    }

    if (position < len) {
      if (position < 0) {
        console.log('shifted last to front');
        _proxied.unshift(..._proxied.splice(position, _proxied.length));
      } else if (position > 0) {
        console.log('shifted front to last');
        _proxied.push(..._proxied.splice(0, position));
      }
    }

    let _slice = this._tracker.slice(topItemIndex, bottomItemIndex);
    debugOnError(`slice is the expected length`, _slice.length === len);

    for (let i = 0; i < len; i++) {
      if (_proxied[i].ref !== _slice[i]) {
        this.recycleVirtualComponent(_proxied[i], _slice[i], i);
      }
    }

    // _proxied.notifyPropertyChanges();
    this.set('activeItems', _proxied);
    this.notifyPropertyChange('activeItems');
    // console.log('active items', _proxied.length);

    let { heightAbove, heightBelow } = this._tracker;

    assert(`Must be equal`, heightAbove === this._tracker.heightAbove);

    this.set('boxStyle', htmlSafe(`padding-top: ${heightAbove}px; padding-bottom: ${heightBelow}px;`));
  },

  /*
  _oldUpdateChildStates() {  // eslint: complexity
    const edges = this._edges;
    const childComponents = this.get('children');

    if (!get(childComponents, 'length')) {
      return;
    }


    if (this._isFirstRender) {
      if (this.get('renderAllInitially')) {
        childComponents.forEach((i) => {
          i.show();
        });

        this._scheduleScrollSync();

        this._isFirstRender = false;
        return;
      }
    }
      ...

    this._scheduleScrollSync();

    if (this._isFirstRender) {
      this._isFirstRender = false;
      this.sendActionOnce('didMountCollection', {
        firstVisible: { item: childComponents[topComponentIndex], index: topComponentIndex },
        lastVisible: { item: childComponents[bottomComponentIndex - 1], index: bottomComponentIndex - 1 }
      });
    }
  },
  */

  // –––––––––––––– Setup/Teardown
  didInsertElement() {
    this.setupRadar();
    // this._initializeScrollState();
    // this._scheduleUpdate();
    console.timeEnd('vertical-collection-init');
  },

  setupRadar() {
    const containerSelector = this.get('containerSelector');
    let container;

    if (containerSelector === 'body') {
      container = window;
    } else {
      container = containerSelector ? closestElement(containerSelector) : this.element.parentNode;
    }

    this._tracker.setupRadar({
      telescope: container,
      sky: this.element,
      minimumMovement: Math.floor(this.get('defaultHeight') / 2),
      bufferSize: this.get('bufferSize')
    });

    this._tracker.updateVisibleContent = () => { this._updateChildStates(); };
  },

  /*
  _initializeScrollState() {
    const idForFirstItem = this.get('idForFirstItem');

    if (this.scrollPosition) {
      this.radar.telescope.scrollTop = this.scrollPosition;
    } else if (this.get('renderFromLast')) {
      const last = this.element.lastElementChild;

      this.set('__isInitializingFromLast', true);
      if (last) {
        last.scrollIntoView(false);
      }
    } else if (idForFirstItem) {
      const items = this.get('items');
      let firstVisibleIndex;

      for (let i = 0; i < get(items, 'length'); i++) {
        if (idForFirstItem === this.keyForItem(valueForIndex(items, i), i)) {
          firstVisibleIndex = i;
        }
      }
      this.radar.telescope.scrollTop = (firstVisibleIndex || 0) * this.get('_defaultHeight');
    }
  },
*/

  willDestroy() {
    this.token.cancelled = true;
    this._tracker.destroy();
    this._tracker = null;
  },

  init() {
    console.time('vertical-collection-init');
    this._super();

    this._tracker = new List(null, this.get('key'), this.get('defaultHeight'));
    this._proxied = new A();
    this.token = new Token();
  }
});

VerticalCollection.reopenClass({
  positionalParams: ['items']
});

export default VerticalCollection;
