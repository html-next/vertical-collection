import scheduler from 'vertical-collection/-private/scheduler';
import Token from 'vertical-collection/-private/scheduler/token';

import { assert } from 'vertical-collection/-debug/helpers';

export default class Radar {
  constructor({ scrollContainer, itemContainer, itemElements, totalItems, minValue, renderFromLast, parentToken }) {
    const {
      top: scrollContainerTop,
      height: scrollContainerHeight
    } = scrollContainer.getBoundingClientRect();

    const {
      top: itemContainerTop
    } = itemContainer.getBoundingClientRect();

    this.scrollContainer = scrollContainer;
    this.scrollContainerTop = scrollContainerTop;
    this.scrollContainerHeight = scrollContainerHeight;

    this.itemContainer = itemContainer;
    this.itemContainerTop = itemContainerTop;

    this.itemElements = itemElements;
    this.totalItems = totalItems;
    this.minValue = minValue;
    this.renderFromLast = renderFromLast;

    this.token = new Token(parentToken);

    // Generally, visibleTop === container.scrollTop. However, if the container is larger than the
    // collection, this may not be the case (ex: Window is the container). In this case, we can say
    // that the visibleTop === container.scrollTop + offset, where offset is some constant distance.
    this._scrollTopOffset = scrollContainer.scrollTop + (itemContainerTop - scrollContainerTop);
    this._scrollTop = scrollContainer.scrollTop;
  }

  schedule(queueName, job) {
    return scheduler.schedule(queueName, job, this.token);
  }

  get scrollTop() {
    return this._scrollTop;
  }

  set scrollTop(scrollY) {
    const deltaScroll = scrollY - (this._scrollTop || 0);
    this._scrollTop = scrollY;

    this.itemContainerTop -= deltaScroll;

    this._update();
  }

  get scrollTopOffset() {
    return this._scrollTopOffset;
  }

  get visibleTop() {
    return this.scrollTop + this._scrollTopOffset;
  }

  set visibleTop(visibleTop) {
    assert('Must set visibleTop to a number', typeof visibleTop === 'number');

    visibleTop = Math.max(0, Math.min(visibleTop, this.total - this.scrollContainerHeight));

    this.scrollTop = visibleTop - this._scrollTopOffset;
  }

  get visibleBottom() {
    return this.visibleTop + this.scrollContainerHeight;
  }

  shiftContainers(dY) {
    this.scrollContainerTop -= dY;
    this.itemContainerTop -= dY;
  }

  prepend(numPrepended) {
    this.totalItems += numPrepended;

    this.schedule('sync', () => {
      this.scrollTop += numPrepended * this.minValue;
      this.scrollContainer.scrollTop = this.scrollTop;
    });
  }

  append(numAppended) {
    this.totalItems += numAppended;
  }
}
