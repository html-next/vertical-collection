import VirtualCollection from '../virtual-collection';
import layout from './template';

const HorizontalCollection = VirtualCollection.extend({
  layout,

  orientation: 'horizontal'
});

export default HorizontalCollection;
