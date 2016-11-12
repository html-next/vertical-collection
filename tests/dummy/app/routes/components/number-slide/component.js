import Ember from 'ember';
import layout from './template';

const {
  htmlSafe
} = Ember.String;

const {
  Component,
  computed
} = Ember;

const base = (255 * 255 * 255);

function setOrder(number, rgb) {
  let point = base / 6;
  if (number <= point) {
    return rgb;
  }
  if (number <= point * 2) {
    return {
      r: rgb.r,
      g: rgb.b,
      b: rgb.g
    };
  }
  if (number <= point * 3) {
    return {
      r: rgb.b,
      g: rgb.r,
      b: rgb.g
    };
  }
  if (number <= point * 4) {
    return {
      r: rgb.g,
      g: rgb.r,
      b: rgb.b
    };
  }
  if (number <= point * 5) {
    return {
      r: rgb.b,
      g: rgb.g,
      b: rgb.r
    };
  }
  return {
    r: rgb.g,
    g: rgb.b,
    b: rgb.r
  };
}

function numberToRGB(number) {
  let num = number;
  number += 385;
  let r = number > 255 ? 255 : number;
  number = r === 255 ? number - 255 : 0;
  let g = number > 255 ? 255 : number;
  let b = g === 255 ? number - 255 : 0;

  return setOrder(num * 16000, {
    r, g, b
  });
}

function numberToOpacity(number) {
  let r = number % 255;

  if (r === 0) {
    return 1;
  }
  if (r === 254) {
    return 0;
  }

  return (255 / r).toFixed(3);
}

export default Component.extend({
  tagName: 'number-slide',
  attributeBindings: ['style'],
  isDynamic: false,
  prefixed: false,
  style: computed('isDynamic', 'item', function() {
    let item = this.get('item');
    let isDynamic = this.get('isDynamic');

    let {
      height,
      number
    } = item;

    let opacity = numberToOpacity(number);
    let styleStr = `background: rgba(0,125,255,${opacity});`;

    if (isDynamic) {
      styleStr += `height:${height}px;`;
    }

    return htmlSafe(styleStr);
  }),
  layout,
  index: 0,
  item: null,
  number: computed.alias('item.number')
});
