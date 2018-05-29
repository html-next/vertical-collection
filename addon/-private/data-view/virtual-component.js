import { set } from '@ember/object';
import { assert } from '@ember/debug';
import { DEBUG } from '@glimmer/env';

import { IS_GLIMMER_2, GTE_EMBER_1_13 } from 'ember-compatibility-helpers';

let VC_IDENTITY = 0;

export default class VirtualComponent {
  constructor(dimension = 'height') {
    this.id = VC_IDENTITY++;

    this.content = null;
    this.index = null;

    this.upperBound = document.createTextNode('');
    this.lowerBound = document.createTextNode('');
    this.element = null;

    this.rendered = false;

    if (dimension === 'height') {
      this._getStartPosition = (boundingClientRect) => boundingClientRect.top;
      this._getEndPosition = (boundingClientRect) => boundingClientRect.bottom;
    } else {
      this._getStartPosition = (boundingClientRect) => boundingClientRect.left;
      this._getEndPosition = (boundingClientRect) => boundingClientRect.right;
    }

    // In older versions of Ember/IE, binding anything on an object in the template
    // adds observers which creates __ember_meta__
    this.__ember_meta__ = null; // eslint-disable-line camelcase

    if (DEBUG && GTE_EMBER_1_13) {
      Object.preventExtensions(this);
    }
  }

  get realUpperBound() {
    return IS_GLIMMER_2 ? this.upperBound : this.upperBound.previousSibling;
  }

  get realLowerBound() {
    return IS_GLIMMER_2 ? this.lowerBound : this.lowerBound.nextSibling;
  }

  getScaledPositionInformation(scale) {
    let { upperBound, lowerBound } = this;

    let startPosition = Infinity;
    let endPosition = -Infinity;

    while (upperBound !== lowerBound) {
      upperBound = upperBound.nextSibling;

      if (upperBound instanceof Element) {
        const boundingClientRect = upperBound.getBoundingClientRect();

        startPosition = Math.min(startPosition, this._getStartPosition(boundingClientRect));
        endPosition = Math.max(endPosition, this._getEndPosition(boundingClientRect));
      }

      if (DEBUG) {
        if (upperBound instanceof Element) {
          continue;
        }

        const text = upperBound.textContent;

        assert(`All content inside of vertical-collection must be wrapped in an element. Detected a text node with content: ${text}`, text === '' || text.match(/^\s+$/));
      }
    }

    assert(
      'Items in a collection require at least one element in them',
      startPosition !== Infinity && endPosition !== -Infinity
    );

    const size = (endPosition - startPosition) * scale;

    startPosition *= scale;
    endPosition *= scale;

    return { startPosition, endPosition, size };
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
