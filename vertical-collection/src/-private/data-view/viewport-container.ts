import type { VerticalRect } from '../utils/element/get-scaled-client-rect.ts';

/*
 * This singleton class provides a way to treat the document viewport
 * like a scrollable element, proxying scroll position access and
 * event listeners to the appropriate browser APIs.
 */
export class ViewportContainer {
  get scrollTop(): number {
    return window.scrollY;
  }

  set scrollTop(v: number) {
    window.scrollTo(window.scrollX, v);
  }

  get scrollLeft(): number {
    return window.scrollX;
  }

  set scrollLeft(v: number) {
    window.scrollTo(v, window.scrollY);
  }

  get offsetHeight(): number {
    return window.innerHeight;
  }

  addEventListener(
    event: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    window.addEventListener(event, handler, options);
  }

  removeEventListener(
    event: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void {
    window.removeEventListener(event, handler, options);
  }

  getBoundingClientRect(): VerticalRect & {
    left: number;
    right: number;
    width: number;
  } {
    return {
      height: window.innerHeight,
      width: window.innerWidth,
      top: 0,
      left: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
    };
  }
}

export default new ViewportContainer();
