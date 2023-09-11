import { computed } from '@ember/object';
import Model, { attr } from '@ember-data/model';

export default Model.extend({
  number: attr('number'),
  prefixed: computed('number', function() {
    return `${this.number}`;
  })
});
