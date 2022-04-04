import { alias } from '@ember/object/computed';
import Component from '@ember/component';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/template';
import layout from './template';

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
      styleStr += `height: ${Math.round(height)}px; box-sizing: content-box;`;
    }

    return htmlSafe(styleStr);
  }),
  layout,
  itemIndex: 0,
  item: null,
  number: alias('item.number')
});
