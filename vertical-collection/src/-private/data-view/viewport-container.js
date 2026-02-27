/*
 * This singleton class provides a way to treat the document viewport
 * like a scrollable element, proxying scroll position access and
 * event listeners to the appropriate browser APIs.
 */
export function ViewportContainer() {
  Object.defineProperty(this, 'scrollTop', {
    get() {
      return window.scrollY;
    },
    set(v) {
      window.scrollTo(window.scrollX, v);
    },
  });

  Object.defineProperty(this, 'scrollLeft', {
    get() {
      return window.scrollX;
    },
    set(v) {
      window.scrollTo(v, window.scrollY);
    },
  });

  Object.defineProperty(this, 'offsetHeight', {
    get() {
      return window.innerHeight;
    },
  });
}

ViewportContainer.prototype.addEventListener = function addEventListener(
  event,
  handler,
  options,
) {
  return window.addEventListener(event, handler, options);
};

ViewportContainer.prototype.removeEventListener = function removeEventListener(
  event,
  handler,
  options,
) {
  return window.removeEventListener(event, handler, options);
};

ViewportContainer.prototype.getBoundingClientRect =
  function getBoundingClientRect() {
    return {
      height: window.innerHeight,
      width: window.innerWidth,
      top: 0,
      left: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
    };
  };

export default new ViewportContainer();
