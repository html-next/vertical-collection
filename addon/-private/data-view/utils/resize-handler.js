const DEFAULT_ARRAY_SIZE = 10;

export class ResizeHandler {
  constructor() {
    this.elements = new Array(DEFAULT_ARRAY_SIZE);
    this.maxLength = DEFAULT_ARRAY_SIZE;
    this.length = 0;
    this.handlers = new Array(DEFAULT_ARRAY_SIZE);
  }

  addResizeHandler(element, handler) {
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
    } else {
      cache = this.handlers[index];
      handlers = cache.handlers;
      handlers.push(handler);
    }

    if (handlers.length === 1) {
      if (element === window) {
        cache.handler = function() {
          ResizeHandler.triggerElementHandlers(cache);
        };

        element.addEventListener('resize', cache.handler, { capture: true, passive: true });
      } else {
        const parentStyle = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          z-index: -1;
          visibility: hidden;
        `;

        const childStyle = `
          position: absolute;
          top: 0;
          left: 0;
          transition: 0s;
        `;

        // Needs to be a position that can be absolutely positioned against
        if (getComputedStyle(element, 'position') == 'static') {
          element.style.position = 'relative';
        }

        const resizeSensor = document.createElement('div');

        resizeSensor.className = 'resize-sensor';
        resizeSensor.cssText = parentStyle;
        resizeSensor.innerHTML = `
          <div class="resize-sensor-expand" style="${parentStyle}">
            <div style="${childStyle} width: 1000000px; height: 1000000px;"></div>
          </div>
          <div class="resize-sensor-shrink" style="${parentStyle}">
            <div style="${childStyle} width: 200%; height: 200%"></div>
          </div>
        `;

        // ES Lint disable because suave wants to destructure these, but aren't always destructurable
        const expand = resizeSensor.getElementsByClassName('resize-sensor-expand')[0]; // eslint-disable-line
        const shrink = resizeSensor.getElementsByClassName('resize-sensor-shrink')[0]; // eslint-disable-line

        element.appendChild(resizeSensor);

        expand.scrollTop = 10000000;
        expand.scrollLeft = 10000000;
        shrink.scrollTop = 10000000;
        shrink.scrollLeft = 10000000;

        cache.expand = expand;
        cache.shrink = shrink;
        cache.handler = function() {
          expand.scrollTop = 10000000;
          expand.scrollLeft = 10000000;
          shrink.scrollTop = 10000000;
          shrink.scrollLeft = 10000000;

          ResizeHandler.triggerElementHandlers(cache);
        };

        expand.addEventListener('scroll', cache.handler, { capture: true, passive: true });
        shrink.addEventListener('scroll', cache.handler, { capture: true, passive: true });
      }
    }
  }

  removeResizeHandler(element, handler) {
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
        index = this.elements.indexOf(element);
        this.handlers.splice(index, 1);
        this.elements.splice(index, 1);

        this.length--;
        this.maxLength--;

        if (this.length === 0) {
          this.isPolling = false;
        }

        if (element === window) {
          element.removeEventListener('resize', elementCache.handler, { capture: true, passive: true });
        } else {
          elementCache.expand.removeEventListener('scroll', elementCache.handler, { capture: true, passive: true });
          elementCache.shrink.removeEventListener('scroll', elementCache.handler, { capture: true, passive: true });
        }
      }

    } else {
      throw new Error('Attempted to remove a handler from an unknown element or an element with no handlers');
    }
  }

  static triggerElementHandlers(meta) {
    for (let j = 0; j < meta.handlers.length; j++) {
      meta.handlers[j]();
    }
  }
}

const instance = new ResizeHandler();

export function addResizeHandler(element, handler) {
  instance.addResizeHandler(element, handler);
}

export function removeResizeHandler(element, handler) {
  instance.removeResizeHandler(element, handler);
}

export default instance;
