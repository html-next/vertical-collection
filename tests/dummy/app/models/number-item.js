import { computed } from '@ember/object';
import DS from 'ember-data';

const {
  attr,
  Model
} = DS;

export default Model.extend({
  number: attr('number'),
  prefixed: computed(function() {
    return `${this.get('number')}`;
  })
});
