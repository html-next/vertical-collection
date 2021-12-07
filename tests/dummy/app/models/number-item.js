import { computed } from '@ember/object';
import Model, { attr } from '@ember-data/model';

export default Model.extend({
  number: attr('number'),
  prefixed: computed(function () {
    return `${this.get('number')}`;
  }),
});
