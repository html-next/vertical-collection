import Ember from 'ember';

import { assert } from 'vertical-collection/-debug/helpers';

const { set } = Ember;

const doc = document;
let VC_IDENTITY = 0;

export default class VirtualComponent {
  constructor() {
    this._tenureId = VC_IDENTITY++;
    this.init();
  }

  init() {
    this.id = VC_IDENTITY++;
    this._upperBound = doc.createTextNode('');
    this._lowerBound = doc.createTextNode('');
    this.height = 0;
    this.content = null;
    this.inDOM = false;
  }

  get upperBound() {
    return this._upperBound;
  }

  get lowerBound() {
    return this._lowerBound;
  }

  getBoundingClientRect() {
    const range = doc.createRange();

    range.setStart(this._upperBound, 0);
    range.setEnd(this._lowerBound, 0);

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
    this._upperBound = null;
    this._lowerBound = null;

    set(this, 'content', null);
  }

  static create() {
    return new VirtualComponent();
  }

  static moveComponents(element, firstComponent, lastComponent, prepend) {
    const rangeToMove = doc.createRange();

    rangeToMove.setStartBefore(firstComponent._upperBound);
    rangeToMove.setEndAfter(lastComponent._lowerBound);

    const docFragment = rangeToMove.extractContents();

    rangeToMove.detach();

    if (prepend) {
      element.insertBefore(docFragment, element.firstChild);
    } else {
      element.appendChild(docFragment);
    }
  }
}
