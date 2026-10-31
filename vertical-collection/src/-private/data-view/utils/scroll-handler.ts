import { assert } from '@ember/debug';
import { begin, end } from '@ember/runloop';
const DEFAULT_ARRAY_SIZE = 10;

export interface ScrollEvent {
  top: number;
  left: number;
}

export type ScrollListener = (event: ScrollEvent) => void;

export interface ScrollElement {
  scrollTop: number;
  scrollLeft: number;
  addEventListener(
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    event: string,
    handler: EventListener,
    options?: boolean | EventListenerOptions,
  ): void;
}

interface ElementHandlers {
  top: number;
  left: number;
  handlers: ScrollListener[];
  passiveHandler: () => void;
}

export class ScrollHandler {
  elements: (ScrollElement | undefined)[];
  maxLength: number;
  length: number;
  handlers: (ElementHandlers | undefined)[];

  constructor() {
    this.elements = new Array<ScrollElement | undefined>(DEFAULT_ARRAY_SIZE);
    this.maxLength = DEFAULT_ARRAY_SIZE;
    this.length = 0;
    this.handlers = new Array<ElementHandlers | undefined>(DEFAULT_ARRAY_SIZE);
  }

  addScrollHandler(element: ScrollElement, handler: ScrollListener): void {
    let index = this.elements.indexOf(element);
    let handlers: ScrollListener[];
    let cache: ElementHandlers;

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
      const existing = this.handlers[index];

      assert('A known element has handlers', existing);
      cache = existing;
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

  removeScrollHandler(element: ScrollElement, handler: ScrollListener): void {
    const index = this.elements.indexOf(element);
    const elementCache = this.handlers[index];

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
        });
      }
    } else {
      throw new Error(
        'Attempted to remove a handler from an unknown element or an element with no handlers',
      );
    }
  }

  static triggerElementHandlers(
    element: ScrollElement,
    meta: ElementHandlers,
  ): void {
    const cachedTop = element.scrollTop;
    const cachedLeft = element.scrollLeft;
    const topChanged = cachedTop !== meta.top;
    const leftChanged = cachedLeft !== meta.left;

    meta.top = cachedTop;
    meta.left = cachedLeft;

    const event = { top: cachedTop, left: cachedLeft };

    if (topChanged || leftChanged) {
      // eslint-disable-next-line ember/no-runloop
      begin();
      for (let j = 0; j < meta.handlers.length; j++) {
        meta.handlers[j]!(event);
      }
      // eslint-disable-next-line ember/no-runloop
      end();
    }
  }
}

const instance = new ScrollHandler();

export function addScrollHandler(
  element: ScrollElement,
  handler: ScrollListener,
): void {
  instance.addScrollHandler(element, handler);
}

export function removeScrollHandler(
  element: ScrollElement,
  handler: ScrollListener,
): void {
  instance.removeScrollHandler(element, handler);
}

export default instance;
