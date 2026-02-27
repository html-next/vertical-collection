import { begin, end } from '@ember/runloop';
const DEFAULT_ARRAY_SIZE = 10;

export class ScrollHandler {
  constructor() {
    this.elements = new Array(DEFAULT_ARRAY_SIZE);
    this.maxLength = DEFAULT_ARRAY_SIZE;
    this.length = 0;
    this.handlers = new Array(DEFAULT_ARRAY_SIZE);
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
        handlers,
        passiveHandler() {
          ScrollHandler.triggerElementHandlers(element, cache);
        },
      };
    } else {
      cache = this.handlers[index];
      handlers = cache.handlers;
      handlers.push(handler);
    }

    if (handlers.length === 1) {
      element.addEventListener('scroll', cache.passiveHandler, {
        capture: true,
        passive: true,
      });
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

      if (!elementCache.handlers.length) {
        index = this.elements.indexOf(element);
        this.handlers.splice(index, 1);
        this.elements.splice(index, 1);

        this.length--;
        this.maxLength--;

        element.removeEventListener('scroll', elementCache.passiveHandler, {
          capture: true,
          passive: true,
        });
      }
    } else {
      throw new Error(
        'Attempted to remove a handler from an unknown element or an element with no handlers',
      );
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

    if (topChanged || leftChanged) {
      begin();
      for (let j = 0; j < meta.handlers.length; j++) {
        meta.handlers[j](event);
      }
      end();
    }
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
