import { set } from '@ember/object';
import { DEBUG } from '@glimmer/env';

import document from '../../utils/document-shim';

let OC_IDENTITY = 0;

export default class OccludedContent {
  constructor(tagName) {
    this.id = `OC-${OC_IDENTITY++}`;
    this.isOccludedContent = true;

    // We check to see if the document exists in Fastboot. Since RAF won't run in
    // Fastboot, we'll never have to use these text nodes for measurements, so they
    // can be empty
    if (document !== undefined) {
      this.element = document.createElement(tagName);
      this.element.className += 'occluded-content';

      this.upperBound = document.createTextNode('');
      this.lowerBound = document.createTextNode('');
    } else {
      this.element = null;
    }

    this.isOccludedContent = true;
    this.rendered = false;

    if (DEBUG) {
      Object.preventExtensions(this);
    }
  }

  getBoundingClientRect() {
    if (this.element !== null) {
      return this.element.getBoundingClientRect();
    }
  }

  addEventListener(event, listener) {
    if (this.element !== null) {
      this.element.addEventListener(event, listener);
    }
  }

  removeEventListener(event, listener) {
    if (this.element !== null) {
      this.element.removeEventListener(event, listener);
    }
  }

  get realUpperBound() {
    return this.upperBound;
  }

  get realLowerBound() {
    return this.lowerBound;
  }

  get parentNode() {
    return this.element !== null ? this.element.parentNode : null;
  }

  get style() {
    return this.element !== null ? this.element.style : {};
  }

  set innerHTML(value) {
    if (this.element !== null) {
      this.element.innerHTML = value;
    }
  }

  destroy() {
    set(this, 'element', null);
  }
}
