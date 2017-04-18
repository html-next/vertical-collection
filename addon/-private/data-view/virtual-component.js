import Ember from 'ember';
import { IS_GLIMMER_2 } from 'vertical-collection/-private/ember/compatibility';

import { assert } from 'vertical-collection/-debug/helpers';

const { set } = Ember;

const doc = document;
let VC_IDENTITY = 0;

export default class VirtualComponent {
  constructor(element) {
    this.id = VC_IDENTITY++;

    this._element = element;

    this._upperBound = doc.createTextNode('');
    this._lowerBound = doc.createTextNode('');

    this.content = null;
  }

  get element() {
    return this._element;
  }

  get upperBound() {
    return this._upperBound;
  }

  get realUpperBound() {
    return IS_GLIMMER_2 ? this._upperBound : this._upperBound.previousSibling;
  }

  get lowerBound() {
    return this._lowerBound;
  }

  get realLowerBound() {
    return IS_GLIMMER_2 ? this._lowerBound : this._lowerBound.nextSibling;
  }

  getBoundingClientRect() {
    const range = doc.createRange();

    range.setStartBefore(this._upperBound);
    range.setEndAfter(this._lowerBound);

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
    this._element = null;
    this._upperBound = null;
    this._lowerBound = null;
    set(this, 'content', null);
  }
}
