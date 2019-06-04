import VirtualCollection from '../virtual-collection';
import layout from './template';

const VerticalCollection = VirtualCollection.extend({
  layout,

  orientation: 'vertical'
});

export default VerticalCollection;
