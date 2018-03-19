import { set } from '@ember/object';
import { assert } from '@ember/debug';
import { DEBUG } from '@glimmer/env';

import { IS_GLIMMER_2, GTE_EMBER_1_13 } from 'ember-compatibility-helpers';

let VC_IDENTITY = 0;

export default class VirtualComponent {
  constructor(content = null, index = null, dimension = 'height') {
    this.id = VC_IDENTITY++;

    this.content = content;
    this.index = index;

    this.upperBound = document.createTextNode('');
    this.lowerBound = document.createTextNode('');
    this.element = null;

    this.rendered = false;

    this._getBoundingClientRect = dimension === 'height'
      ? this._getBoundingClientRectForVerticalCollection
      : this._getBoundingClientRectForHorizontalCollection;

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

  getBoundingClientRect() {
    return this._getBoundingClientRect();
  }

  _getBoundingClientRectForHorizontalCollection() {
    let { upperBound, lowerBound } = this;

    let left = Infinity;
    let right = -Infinity;

    while (upperBound !== lowerBound) {
      upperBound = upperBound.nextSibling;

      if (upperBound instanceof Element) {
        left = Math.min(left, upperBound.getBoundingClientRect().left);
        right = Math.max(right, upperBound.getBoundingClientRect().right);
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
      'Items in a horizontal collection require at least one element in them',
      left !== Infinity && right !== -Infinity
    );

    const width = right - left;

    return { left, right, width };
  }

  _getBoundingClientRectForVerticalCollection() {
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

    assert('Items in a vertical collection require at least one element in them', top !== Infinity && bottom !== -Infinity);

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
    set(this, 'element', null);
    set(this, 'upperBound', null);
    set(this, 'lowerBound', null);
    set(this, 'content', null);
    set(this, 'index', null);
  }
}
