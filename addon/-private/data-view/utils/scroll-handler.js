import { begin, end } from '@ember/runloop';
import { scheduler } from 'ember-raf-scheduler';
import SUPPORTS_PASSIVE from './supports-passive';
const DEFAULT_ARRAY_SIZE = 10;
const UNDEFINED_VALUE = Object.create(null);

export class ScrollHandler {
  constructor() {
    this.elements = new Array(DEFAULT_ARRAY_SIZE);
    this.maxLength = DEFAULT_ARRAY_SIZE;
    this.length = 0;
    this.handlers = new Array(DEFAULT_ARRAY_SIZE);
    this.isPolling = false;
    this.isUsingPassive = SUPPORTS_PASSIVE;
  }

  addScrollHandler(element, handler) {
    let index = this.elements.indexOf(element);
    let handlers, cache;

    if (index === -1) {
      index = this.length++;

      if (index === this.maxLength) {
        this.maxLength *= 2;
        this.elements.length = this.maxLength;
        this.handlers.length = this.maxLength;
      }

      handlers = [handler];

      this.elements[index] = element;
      cache = this.handlers[index] = {
        top: element.scrollTop,
        left: element.scrollLeft,
        handlers
      };
      // TODO add explicit test
      if (SUPPORTS_PASSIVE) {
        cache.passiveHandler = function() {
          ScrollHandler.triggerElementHandlers(element, cache);
        };
      } else {
        cache.passiveHandler = UNDEFINED_VALUE;
      }
    } else {
      cache = this.handlers[index];
      handlers = cache.handlers;
      handlers.push(handler);
    }

    // TODO add explicit test
    if (this.isUsingPassive && handlers.length === 1) {
      element.addEventListener('scroll', cache.passiveHandler, { capture: true, passive: true });

    // TODO add explicit test
    } else if (!this.isPolling) {
      this.poll();
    }
  }

  removeScrollHandler(element, handler) {
    let index = this.elements.indexOf(element);
    let elementCache = this.handlers[index];
    // TODO add explicit test
    if (elementCache && elementCache.handlers) {
      let index = elementCache.handlers.indexOf(handler);

      if (index === -1) {
        throw new Error('Attempted to remove an unknown handler');
      }

      elementCache.handlers.splice(index, 1);

      // cleanup element entirely if needed
      // TODO add explicit test
      if (!elementCache.handlers.length) {
        index = this.elements.indexOf(element);
        this.handlers.splice(index, 1);
        this.elements.splice(index, 1);

        this.length--;
        this.maxLength--;

        if (this.length === 0) {
          this.isPolling = false;
        }

        // TODO add explicit test
        if (this.isUsingPassive) {
          element.removeEventListener('scroll', elementCache.passiveHandler, { capture: true, passive: true });
        }
      }

    } else {
      throw new Error('Attempted to remove a handler from an unknown element or an element with no handlers');
    }
  }

  static triggerElementHandlers(element, meta) {
    let cachedTop = element.scrollTop;
    let cachedLeft = element.scrollLeft;
    let topChanged = cachedTop !== meta.top;
    let leftChanged = cachedLeft !== meta.left;

    meta.top = cachedTop;
    meta.left = cachedLeft;

    let event = { top: cachedTop, left: cachedLeft };

    // TODO add explicit test
    if (topChanged || leftChanged) {
      begin();
      for (let j = 0; j < meta.handlers.length; j++) {
        meta.handlers[j](event);
      }
      end();
    }
  }

  poll() {
    this.isPolling = true;

    scheduler.schedule('sync', () => {
      // TODO add explicit test
      if (!this.isPolling) {
        return;
      }

      for (let i = 0; i < this.length; i++) {
        let element = this.elements[i];
        let info = this.handlers[i];

        ScrollHandler.triggerElementHandlers(element, info);
      }

      this.isPolling = this.length > 0;
      // TODO add explicit test
      if (this.isPolling) {
        this.poll();
      }
    });
  }
}

const instance = new ScrollHandler();

export function addScrollHandler(element, handler) {
  instance.addScrollHandler(element, handler);
}

export function removeScrollHandler(element, handler) {
  instance.removeScrollHandler(element, handler);
}

export default instance;
