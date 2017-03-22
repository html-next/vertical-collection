import Token from 'vertical-collection/-private/scheduler/token';
import Ember from 'ember';

import { assert } from 'vertical-collection/-debug/helpers';

const { set } = Ember;

const doc = document;
let VC_IDENTITY = 0;

export default class VirtualComponent {
  constructor(parentToken) {
    this._tenureId = VC_IDENTITY++;
    this.init(parentToken);
  }

  init(parentToken) {
    this.id = VC_IDENTITY++;
    this._upperBound = doc.createTextNode('');
    this._lowerBound = doc.createTextNode('');
    this.height = 0;
    this.range = doc.createRange();
    this.content = null;
    this.inDOM = false;
    this.token = new Token(parentToken);
  }

  get upperBound() {
    return this._upperBound;
  }

  get lowerBound() {
    return this._lowerBound;
  }

  get parentElement() {
    return this._upperBound.parentElement;
  }

  getBoundingClientRect() {
    this.range.setStart(this._upperBound, 0);
    this.range.setEnd(this._lowerBound, 0);

    const rect = this.range.getBoundingClientRect();

    this.range.detach();

    return rect;
  }

  recycle(newContent, newIndex) {
    assert(`You cannot set an item's content to undefined`, newContent);

    set(this, 'index', newIndex);

    if (this.content !== newContent) {
      set(this, 'content', newContent);
    }
  }

  destroy() {
    this.token.cancel();
    this.range.detach();
    this.range = null;

    this._upperBound = null;
    this._lowerBound = null;

    set(this, 'content', null);
  }

  static create(parentToken) {
    return new VirtualComponent(parentToken);
  }

  static moveComponents(element, firstComponent, lastComponent, prepend) {
    const rangeToMove = new Range();

    rangeToMove.setStart(firstComponent._upperBound, 0);
    rangeToMove.setEnd(lastComponent._lowerBound, 0);

    const docFragment = rangeToMove.extractContents();

    rangeToMove.detach();

    // The first and last nodes in the range do not get extracted, and are instead cloned, so they
    // have to be reset.
    //
    // NOTE: Ember 1.11 - there are cases where docFragment is null (they haven't been rendered yet.)
    firstComponent._upperBound = docFragment.firstChild || firstComponent._upperBound;
    lastComponent._lowerBound = docFragment.lastChild || lastComponent._lowerBound;

    if (prepend) {
      element.insertBefore(docFragment, element.firstChild);
    } else {
      element.appendChild(docFragment);
    }
  }
}
