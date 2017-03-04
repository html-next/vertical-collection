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
    this._scrollTopOffset = null;

    this._itemContainer = null;
    this._scrollContiner = null;

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
    this._scheduleUpdate();
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
  _scheduleUpdate() {
    if (!this._nextUpdate) {
      this._nextUpdate = this.schedule('sync', () => {
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
    return this._scrollTop;
  }

  set scrollTop(scrollTop) {
    if (this._scrollTop === scrollTop) {
      return;
    }

    this._scrollTop = scrollTop;

    this._scheduleUpdate();
  }

  get scrollTopOffset() {
    if (this._scrollTopOffset === null) {
      const itemContainerTop = this.itemContainer ? this.itemContainer.getBoundingClientRect().top : 0;
      const scrollContainerTop = this.scrollContainer ? this.scrollContainer.getBoundingClientRect().top : 0;

      this._scrollTopOffset = (this.scrollContainer.scrollTop + itemContainerTop) - scrollContainerTop;
    }

    return this._scrollTopOffset;
  }

  get visibleTop() {
    return this.scrollTop + this.scrollTopOffset;
  }

  set visibleTop(visibleTop) {
    assert('Must set visibleTop to a number', typeof visibleTop === 'number');

    this.scrollTop = visibleTop - this.scrollTopOffset;
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
      totalAfter
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
        }
      } else {
        for (let i = virtualComponents.length - 1; i > delta; i--) {
          virtualComponents[i].destroy;
        }
      }

      virtualComponents.length = totalComponents;
      orderedComponents.length = totalComponents;

      for (let i = 0; i < totalComponents; i++) {
        orderedComponents[i] = virtualComponents[i];
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
    this.scrollTop += numPrepended * this.minHeight;

    this.schedule('sync', () => {
      this._scrollContainer.scrollTop = this.scrollTop;
    });
  }

  append(items) {
    this.items = items;
  }

  resetItems(items) {
    this.items = items;
  }
}
