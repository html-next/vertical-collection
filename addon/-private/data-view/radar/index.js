import Ember from 'ember';

import scheduler from 'vertical-collection/-private/scheduler';
import Token from 'vertical-collection/-private/scheduler/token';

import VirtualComponent from 'vertical-collection/-private/data-view/virtual-component';

import { assert } from 'vertical-collection/-debug/helpers';

const {
  A,
  set
} = Ember;

export default class Radar {
  constructor() {
    this.token = new Token();

    this._scrollTop = 0;
    this._prependOffset = 0;
    this._scrollTopOffset = null;

    this._itemContainer = null;
    this._scrollContainer = null;

    this.minHeight = 0;
    this.bufferSize = 0;
    this.renderFromLast = 0;

    this.virtualComponents = A();
    this.orderedComponents = [];
  }

  init(...args) {
    this.setContainerState(...args);
  }

  setContainerState(itemContainer, scrollContainer, minHeight, bufferSize, renderFromLast) {
    this.itemContainer = itemContainer;
    this.scrollContainer = scrollContainer;

    this.minHeight = minHeight;
    this.bufferSize = bufferSize;
    this.renderFromLast = renderFromLast;

    this._updateVirtualComponentPool();
    this.scheduleUpdate();
  }

  destroy() {
    this.token.cancel();

    for (let i = 0; i < this.orderedComponents.length; i++) {
      this.orderedComponents[i].destroy();
    }

    this.orderedComponents = null;
    this.virtualComponents = null;

  }

  schedule(queueName, job) {
    return scheduler.schedule(queueName, job, this.token);
  }

  /*
   * Schedules an update for the next RAF
   *
   * This will first run _updateVirtualComponents in the sync phase, which figures out what
   * components need to be rerendered and updates the appropriate VCs and moves their associated
   * DOM. At the end of the `sync` phase the runloop is flushed and Glimmer renders the changes.
   *
   * By the `affect` phase the Radar should have had time to measure, meaning it has all of the
   * current info and we can send actions for any changes.
   *
   * @private
   */
  scheduleUpdate() {
    if (!this._nextUpdate) {
      this._nextUpdate = this.schedule('sync', () => {
        this._scrollTop = this.scrollContainer.scrollTop;
        this._nextUpdate = null;
        this._updateIndexes();
        this._updateVirtualComponents();
      });
    }

    if (!this._nextDidUpdate) {
      this._nextDidUpdate = this.schedule('affect', () => {
        this._nextDidUpdate = null;
        this.didUpdate();
      });
    }
  }

  get totalItems() {
    return this.items ? this.items.length : 0;
  }

  set itemContainer(itemContainer) {
    this._itemContainer = itemContainer;
    this._scrollTopOffset = null;
  }

  get itemContainer() {
    return this._itemContainer;
  }

  set scrollContainer(scrollContainer) {
    this._scrollContainer = scrollContainer;
    this._scrollTopOffset = null;
    this._scrollTop = scrollContainer.scrollTop;
    this.scrollContainerHeight = scrollContainer.getBoundingClientRect().height;
  }

  get scrollContainer() {
    return this._scrollContainer;
  }

  get scrollTop() {
    return this.scrollContainer.scrollTop;
  }

  set scrollTop(scrollTop) {
    this.scrollContainer.scrollTop = scrollTop;
  }

  /*
   * Represents the offset between the top of the itemContainer and the top of scrollContainer
   * when `scrollTop === 0`. Basically, the item container could "begin" anywhere in the
   * scrollContainer. There could be some header or other element _before_ the itemContainer that
   * pushes it down a little bit. In this case, the true position of the scrollContainer's top
   * relative to our measurements, which begin at 0, is `scrollTop - scrollTopOffset`. In other
   * words, while we _can't_ have a negative `scrollTop`, we _can_ have a negative `visibleTop`.
   */
  get scrollTopOffset() {
    if (this._scrollTopOffset === null) {
      const itemContainerTop = this.itemContainer ? this.itemContainer.getBoundingClientRect().top : 0;
      const scrollContainerTop = this.scrollContainer ? this.scrollContainer.getBoundingClientRect().top : 0;

      this._scrollTopOffset = (this.scrollTop + itemContainerTop) - scrollContainerTop;
    }

    return this._scrollTopOffset;
  }

  /*
   * `prependOffset` exists because there are times when we need to do the following in this exact
   * order:
   *
   * 1. Prepend, which means we need to adjust the scroll position by `minHeight * numPrepended`
   * 2. Calculate the items that will be displayed after the prepend, and move VCs around as
   *    necessary (`scheduleUpdate`).
   * 3. Actually add the amount prepended to `scrollContainer.scrollTop`
   *
   * This is due to some strange behavior in Chrome where it will modify `scrollTop` on it's own
   * when prepending item elements. We seem to avoid this behavior by doing these things in a RAF
   * in this exact order.
   */
  get prependOffset() {
    return this._prependOffset;
  }

  set prependOffset(offset) {
    this._prependOffset = offset;

    this.schedule('sync', () => {
      this.scrollTop += this._prependOffset;
      this._prependOffset = 0;
    });
  }

  get visibleTop() {
    return this.scrollTop + this.prependOffset + this.scrollTopOffset;
  }

  set visibleTop(visibleTop) {
    assert('Must set visibleTop to a number', typeof visibleTop === 'number');

    this.scrollTop = visibleTop - this.prependOffset - this.scrollTopOffset;
  }

  get visibleBottom() {
    return this.visibleTop + this.scrollContainerHeight;
  }

  /*
   * Update the VirtualComponents state based on current scroll position
   *
   * @private
   */
  _updateVirtualComponents() {
    const {
      items,
      orderedComponents,

      _itemContainer,
      _prevFirstItemIndex,

      firstItemIndex,
      lastItemIndex,
      totalBefore,
      totalAfter,
      total
    } = this;

    const itemDelta = firstItemIndex - _prevFirstItemIndex;
    const offsetAmount = Math.abs(itemDelta % orderedComponents.length);

    if (offsetAmount > 0) {
      if (itemDelta < 0) {
        // Scrolling up
        let movedComponents = orderedComponents.splice(-offsetAmount);

        orderedComponents[0].hasBeenMeasured = false;
        orderedComponents.unshift(...movedComponents);

        VirtualComponent.moveComponents(_itemContainer, movedComponents[0], movedComponents[movedComponents.length - 1], true);
      } else if (itemDelta > 0) {
        // Scrolling down
        let movedComponents = orderedComponents.splice(0, offsetAmount);

        orderedComponents[0].hasBeenMeasured = false;
        orderedComponents.push(...movedComponents);

        VirtualComponent.moveComponents(_itemContainer, movedComponents[0], movedComponents[movedComponents.length - 1], false);
      }
    }

    for (let i = 0, itemIndex = firstItemIndex; itemIndex <= lastItemIndex; i++, itemIndex++) {
      orderedComponents[i].recycle(items[itemIndex], itemIndex);
    }

    _itemContainer.style.paddingTop = `${totalBefore}px`;
    _itemContainer.style.paddingBottom = `${totalAfter}px`;
    _itemContainer.style.minHeight = `${total}px`;

    this._prevFirstItemIndex = firstItemIndex;
  }

  /*
   * Sets up _virtualComponents, which is meant to be a static pool of components that we render to.
   * In order to decrease the time spent rendering and diffing, we pull the {{each}} out of the DOM
   * and only replace the content of _virtualComponents which are removed/added.
   *
   * For instance, if we start with the following and scroll down, items 2 and 3 do not need to be
   * rerendered, only item 1 needs to be removed and only item 4 needs to be added. So we replace
   * item 1 with item 4, and then manually move the DOM:
   *
   *   1                        4                         2
   *   2 -> replace 1 with 4 -> 2 -> manually move DOM -> 3
   *   3                        3                         4
   *
   * However, _virtualComponents is still out of order. Rather than keep track of the state of
   * things in _virtualComponents, we track the visually ordered components in the
   * _orderedComponents array. This is possible because all of our operations are relatively simple,
   * popping some number of components off one end and pushing them onto the other.
   *
   * @private
   */
  _updateVirtualComponentPool() {
    const {
      scrollContainerHeight,
      bufferSize,
      minHeight,
      virtualComponents,
      orderedComponents,
      totalItems
    } = this;

    // The total number of components is determined by the minimum number required to span the
    // container with its buffers. Combined with the above rendering strategy this fairly
    // performant, even if mean item size is above the minimum.
    const totalHeight = scrollContainerHeight + (scrollContainerHeight * bufferSize * 2);
    const totalComponents = Math.min(totalItems, Math.ceil(totalHeight / minHeight) + 1);
    const delta = totalComponents - virtualComponents.get('length');

    if (delta) {
      if (delta > 0) {
        for (let i = 0; i < delta; i++) {
          let component = new VirtualComponent(this.token);
          set(component, 'content', {});

          virtualComponents.pushObject(component);
          orderedComponents.push(component);
        }
      } else {
        for (let i = virtualComponents.length - 1; i > delta; i--) {
          virtualComponents[i].destroy;
        }

        virtualComponents.length = totalComponents;
        orderedComponents.length = totalComponents;
      }

      if (delta > 0) {
        this.schedule('sync', () => {
          VirtualComponent.moveComponents(
            this.itemContainer,
            orderedComponents[orderedComponents.length - delta],
            orderedComponents[orderedComponents.length - 1]
          );
        });
      }
    }
  }

  prepend(items, numPrepended) {
    this.items = items;
    this._prevFirstItemIndex += numPrepended;

    this._updateVirtualComponentPool();
    this.scheduleUpdate();

    this.prependOffset = numPrepended * this.minHeight;
  }

  append(items) {
    this.items = items;

    this._updateVirtualComponentPool();
    this.scheduleUpdate();
  }

  resetItems(items) {
    this.items = items;

    this._updateVirtualComponentPool();
    this.scheduleUpdate();
  }
}
