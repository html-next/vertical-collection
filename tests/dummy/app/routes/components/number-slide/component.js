import Ember from 'ember';
import layout from './template';

const {
  htmlSafe
} = Ember.String;

const {
  Component,
  computed
} = Ember;

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
  isDynamic: true,
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
  incrementBy: 250,
  number: computed.alias('item.number'),
  click() {
    this.item.height += this.get('incrementBy');
    this.notifyPropertyChange('item');
    this.sendAction('didResize');
  }
});
