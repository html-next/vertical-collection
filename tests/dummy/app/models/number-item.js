import Ember from 'ember';
import DS from 'ember-data';

const {
  computed
} = Ember;

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
