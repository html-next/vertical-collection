import Ember from 'ember';
import { IS_GLIMMER_2 } from '../ember-internals/compatibility';

import { assert, stripInProduction } from 'vertical-collection/-debug/helpers';

const { set } = Ember;

let VC_IDENTITY = 0;

export default class VirtualComponent {
  constructor(content = null, index = null) {
    this.id = VC_IDENTITY++;

    this.content = content;
    this.index = index;

    this.upperBound = document.createTextNode('');
    this.lowerBound = document.createTextNode('');
    this.element = null;

    // In older versions of Ember, binding anything on an object in the template
    // adds observers which creates __ember_meta__
    this.__ember_meta__ = null; // eslint-disable-line camelcase

    stripInProduction(() => {
      Object.preventExtensions(this);
    });
  }

  get realUpperBound() {
    return IS_GLIMMER_2 ? this.upperBound : this.upperBound.previousSibling;
  }

  get realLowerBound() {
    return IS_GLIMMER_2 ? this.lowerBound : this.lowerBound.nextSibling;
  }

  getBoundingClientRect() {
    const range = document.createRange();

    range.setStartBefore(this.upperBound);
    range.setEndAfter(this.lowerBound);

    const rect = range.getBoundingClientRect();

    range.detach();

    return rect;
  }

  recycle(newContent, newIndex) {
    assert(`You cannot set an item's content to undefined`, newContent);

    if (this.index !== newIndex) {
      set(this, 'index', newIndex);
    }

    if (this.content !== newContent) {
      set(this, 'content', newContent);
    }
  }

  destroy() {
    set(this, 'element', null);
    set(this, 'upperBound', null);
    set(this, 'lowerBound', null);
    set(this, 'content', null);
    set(this, 'index', null);
  }
}
