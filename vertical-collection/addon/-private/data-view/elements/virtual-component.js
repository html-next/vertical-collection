import { set } from '@ember/object';
import { assert } from '@ember/debug';
import { DEBUG } from '@glimmer/env';

import document from '../../utils/document-shim';

let VC_IDENTITY = 0;

export default class VirtualComponent {
  constructor(content = null, index = null) {
    this.id = `VC-${VC_IDENTITY++}`;

    this.content = content;
    this.index = index;

    // We check to see if the document exists in Fastboot. Since RAF won't run in
    // Fastboot, we'll never have to use these text nodes for measurements, so they
    // can be empty
    this.upperBound = document !== undefined ? document.createTextNode('') : null;
    this.lowerBound = document !== undefined ? document.createTextNode('') : null;

    this.rendered = false;

    if (DEBUG) {
      Object.preventExtensions(this);
    }
  }

  get realUpperBound() {
    return this.upperBound;
  }

  get realLowerBound() {
    return this.lowerBound;
  }

  getBoundingClientRect() {
    let { upperBound, lowerBound } = this;

    let top = Infinity;
    let bottom = -Infinity;

    while (upperBound !== lowerBound) {
      upperBound = upperBound.nextSibling;

      if (upperBound instanceof Element) {
        top = Math.min(top, upperBound.getBoundingClientRect().top);
        bottom = Math.max(bottom, upperBound.getBoundingClientRect().bottom);
      }

      if (DEBUG) {
        if (upperBound instanceof Element) {
          continue;
        }

        const text = upperBound.textContent;

        assert(`All content inside of vertical-collection must be wrapped in an element. Detected a text node with content: ${text}`, text === '' || text.match(/^\s+$/));
      }
    }

    assert('Items in a vertical collection require atleast one element in them', top !== Infinity && bottom !== -Infinity);

    const height = bottom - top;

    return { top, bottom, height };
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
    set(this, 'upperBound', null);
    set(this, 'lowerBound', null);
    set(this, 'content', null);
    set(this, 'index', null);
  }
}
