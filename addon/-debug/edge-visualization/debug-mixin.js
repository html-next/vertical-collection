import { assert } from '@ember/debug';
import Mixin from '@ember/object/mixin';
import Visualization from './visualization';
import { ViewportContainer } from '../../-private';

import {
  styleIsOneOf,
  hasStyleValue,
  hasStyleWithNonZeroValue,
} from '../utils/validate-style';

export default Mixin.create({
  debugVis: false,
  debugCSS: false,

  __visualization: null,

  init() {
    this._super(...arguments);

    this._radar._debugDidUpdate = () => {
      this.updateVisualization();
      this.detectIssuesWithCSS();
    };
  },

  detectIssuesWithCSS() {
    if (this.get('debugCSS') === false) {
      return;
    }

    let radar = this._radar;
    let styles;

    // check telescope
    if (radar.scrollContainer !== ViewportContainer) {
      styles = window.getComputedStyle(radar.scrollContainer);
    } else {
      styles = window.getComputedStyle(document.body);
    }

    assert(
      `scrollContainer cannot be inline.`,
      styleIsOneOf(styles, 'display', [
        'block',
        'inline-block',
        'flex',
        'inline-flex',
      ])
    );
    assert(
      `scrollContainer must define position`,
      styleIsOneOf(styles, 'position', ['static', 'relative', 'absolute'])
    );
    assert(
      `scrollContainer must define height or max-height`,
      hasStyleWithNonZeroValue(styles, 'height') ||
        hasStyleWithNonZeroValue(styles, 'max-height')
    );

    // conditional perf check for non-body scrolling
    if (radar.scrollContainer !== ViewportContainer) {
      assert(
        `scrollContainer must define overflow-y`,
        hasStyleValue(styles, 'overflow-y', 'scroll') ||
          hasStyleValue(styles, 'overflow', 'scroll')
      );
    }

    // check itemContainer
    styles = window.getComputedStyle(radar.itemContainer);

    assert(
      `itemContainer cannot be inline.`,
      styleIsOneOf(styles, 'display', [
        'block',
        'inline-block',
        'flex',
        'inline-flex',
      ])
    );
    assert(
      `itemContainer must define position`,
      styleIsOneOf(styles, 'position', ['static', 'relative', 'absolute'])
    );

    // check item defaults
    assert(
      `You must supply at least one item to the collection to debug it's CSS.`,
      this.get('items.length')
    );

    let element = radar._itemContainer.firstElementChild;

    styles = window.getComputedStyle(element);

    assert(
      `Item cannot be inline.`,
      styleIsOneOf(styles, 'display', [
        'block',
        'inline-block',
        'flex',
        'inline-flex',
      ])
    );
    assert(
      `Item must define position`,
      styleIsOneOf(styles, 'position', ['static', 'relative', 'absolute'])
    );
  },

  updateVisualization() {
    if (this.get('debugVis') === false) {
      if (this.__visualization !== null) {
        console.info('tearing down existing visualization'); // eslint-disable-line no-console
        this.__visualization.destroy();
        this.__visualization = null;
      }
      return;
    }

    if (this.__visualization === null) {
      this.__visualization = new Visualization(this._radar);
    }

    this.__visualization.render();
  },

  willDestroy() {
    this._super();
    if (this.__visualization) {
      console.info('destroying visualization'); // eslint-disable-line no-console
      this.__visualization.destroy();
      this.__visualization = null;
    }
  },
});
