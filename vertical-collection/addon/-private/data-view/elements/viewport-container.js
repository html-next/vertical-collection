/*
 * There are significant differences between browsers
 * in how they implement "scroll" on document.body
 *
 * The only cross-browser listener for scroll on body
 * is to listen on window with capture.
 *
 * They also implement different standards for how to
 * access the scroll position.
 *
 * This singleton class provides a cross-browser way
 * to access and set the scrollTop and scrollLeft properties.
 *
 */
export function ViewportContainer() {

  // A bug occurs in Chrome when we reload the browser at a lower
  // scrollTop, window.scrollY becomes stuck on a single value.
  Object.defineProperty(this, 'scrollTop', {
    get() {
      return document.body.scrollTop
        || document.documentElement.scrollTop;
    },
    set(v) {
      document.body.scrollTop = document.documentElement.scrollTop = v;
    }
  });

  Object.defineProperty(this, 'scrollLeft', {
    get() {
      return window.scrollX
        || window.pageXOffset
        || document.body.scrollLeft
        || document.documentElement.scrollLeft;
    },
    set(v) {
      window.scrollX
        = window.pageXOffset
        = document.body.scrollLeft
        = document.documentElement.scrollLeft = v;
    }
  });

  Object.defineProperty(this, 'offsetHeight', {
    get() {
      return window.innerHeight;
    }
  });
}

ViewportContainer.prototype.addEventListener = function addEventListener(event, handler, options) {
  return window.addEventListener(event, handler, options);
};

ViewportContainer.prototype.removeEventListener = function addEventListener(event, handler, options) {
  return window.removeEventListener(event, handler, options);
};

ViewportContainer.prototype.getBoundingClientRect = function getBoundingClientRect() {
  return {
    height: window.innerHeight,
    width: window.innerWidth,
    top: 0,
    left: 0,
    right: window.innerWidth,
    bottom: window.innerHeight
  };
};

export default new ViewportContainer();
