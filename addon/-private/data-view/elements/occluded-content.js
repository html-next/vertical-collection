import { set } from '@ember/object';
import { DEBUG } from '@glimmer/env';

import { IS_GLIMMER_2, gte as emberVersionGTE } from 'ember-compatibility-helpers';
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

    // In older versions of Ember/IE, binding anything on an object in the template
    // adds observers which creates __ember_meta__
    this.__ember_meta__ = null; // eslint-disable-line camelcase

    if (DEBUG && emberVersionGTE('1.13.0')) {
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

  get realUpperBound() {
    return IS_GLIMMER_2 ? this.upperBound : this.upperBound.previousSibling;
  }

  get realLowerBound() {
    return IS_GLIMMER_2 ? this.lowerBound : this.lowerBound.nextSibling;
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
