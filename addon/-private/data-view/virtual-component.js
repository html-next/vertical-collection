import Ember from 'ember';

import { assert } from 'vertical-collection/-debug/helpers';

const { set, VERSION } = Ember;

const doc = document;
let VC_IDENTITY = 0;

const isGlimmer2 = VERSION.match(/2.\d\d+.\d+/) !== null;

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

  get realUpperBound() {
    return isGlimmer2 ? this._upperBound : this._upperBound.previousSibling;
  }

  get lowerBound() {
    return this._lowerBound;
  }

  get realLowerBound() {
    return isGlimmer2 ? this._lowerBound : this._lowerBound.nextSibling;
  }

  get parentElement() {
    return this._upperBound.parentElement;
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
    if (this.parentElement) {
      const {
        parentElement,
        realUpperBound: firstNode,
        realLowerBound: lastNode
      } = this;

      let node = firstNode;
      let nextNode;

      while (node) {
        nextNode = node.nextSibling;
        parentElement.removeChild(node);

        if (node === lastNode) {
          break;
        }

        node = nextNode;
      }
    }

    this._upperBound = null;
    this._lowerBound = null;
    set(this, 'content', null);
  }

  static create() {
    return new VirtualComponent();
  }
}
