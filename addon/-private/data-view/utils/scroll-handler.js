import scheduler from '../../scheduler';
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
    let handlers;
    let cache;

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
        top: UNDEFINED_VALUE,
        left: UNDEFINED_VALUE,
        handlers
      };
      cache.passiveHandler = SUPPORTS_PASSIVE ? function() { ScrollHandler.triggerElementHandlers(element, cache); }
        : UNDEFINED_VALUE
    } else {
      cache = this.handlers[index];
      handlers = cache.handlers;
      handlers.push(handler);
    }

    if (this.isUsingPassive && handlers.length === 1) {
      element.addEventListener('scroll', cache.passiveHandler, { capture: true, passive: true });
    } else if (!this.isPolling) {
      this.poll();
    }
  }

  removeScrollHandler(element, handler) {
    let index = this.elements.indexOf(element);
    let elementCache = this.handlers[index];

    if (elementCache && elementCache.handlers) {
      let index = elementCache.handlers.indexOf(handler);

      if (index === -1) {
        throw new Error('Attempted to remove an unknown handler');
      }

      elementCache.handlers.splice(index, 1);

      // cleanup element entirely if needed
      if (!elementCache.handlers.length) {
        this.handlers.splice(index, 1);

        index = this.elements.indexOf(element);
        this.elements.splice(index, 1);
        this.length--;
        this.maxLength--;

        if (this.length === 0) {
          this.isPolling = false;
        }

        if (this.isUsingPassive) {
          element.removeEventListener('scroll', elementCache.passiveHandler, {capture: true, passive: true});
        }
      }

    } else {
      throw new Error('Attempted to remove a handler from an unknown element or an element with no handlers');
    }
  }

  static triggerElementHandlers(element, meta) {
    let cachedTop = element.scrollTop;
    let cachedLeft = element.scrollLeft;
    let topChanged = cachedTop !== meta.top && meta.top !== UNDEFINED_VALUE;
    let leftChanged = cachedLeft !== meta.left && meta.left !== UNDEFINED_VALUE;

    meta.top = cachedTop;
    meta.left = cachedLeft;

    let event = { top: cachedTop, left: cachedLeft };

    if (topChanged || leftChanged) {
      for (let j = 0; j < meta.handlers.length; j++) {
        meta.handlers[j](event);
      }
    }
  }

  poll() {
    this.isPolling = true;

    scheduler.schedule('sync', () => {
      if (!this.isPolling) {
        return;
      }

      for (let i = 0; i < this.length; i++) {
        let element = this.elements[i];
        let info = this.handlers[i];

        ScrollHandler.triggerElementHandlers(element, info);
      }

      this.isPolling = this.length > 0;
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
