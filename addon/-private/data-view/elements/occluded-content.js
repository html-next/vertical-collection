import { set } from '@ember/object';
import { DEBUG } from '@glimmer/env';

import { IS_GLIMMER_2, GTE_EMBER_1_13 } from 'ember-compatibility-helpers';
import document from '../../utils/document-shim';

let OC_IDENTITY = 0;

export default class OccludedContent {
  constructor() {
    this.id = `OC-${OC_IDENTITY++}`;
    this.isOccludedContent = true;

    // We check to see if the document exists in Fastboot. Since RAF won't run in
    // Fastboot, we'll never have to use these text nodes for measurements, so they
    // can be empty
    this.element = document !== undefined ? document.createElement('occluded-content') : null;

    this.rendered = false;

    // In older versions of Ember/IE, binding anything on an object in the template
    // adds observers which creates __ember_meta__
    this.__ember_meta__ = null; // eslint-disable-line camelcase

    if (DEBUG && GTE_EMBER_1_13) {
      Object.preventExtensions(this);
    }
  }

  get realUpperBound() {
    return IS_GLIMMER_2 ? this.element : this.element.previousSibling;
  }

  get realLowerBound() {
    return IS_GLIMMER_2 ? this.element : this.element.nextSibling;
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

  addEventListener(event, listener) {
    if (this.element !== null) {
      this.element.addEventListener(event, listener);
    }
  }

  getBoundingClientRect() {
    if (this.element !== null) {
      return this.element.getBoundingClientRect();
    }
  }

  destroy() {
    set(this, 'element', null);
  }
}
