import DS from 'ember-data';
import Ember from 'ember';

const {
  RSVP
} = Ember;

const NUMBERS = {
  data: []
};

for (let i = 0; i < 100; i++) {
  NUMBERS.data.push({
    type: 'number-item',
    id: `${i}`,
    attributes: {
      number: i
    }
  });
}

// Pre 1.13, the JSONAPIAdapter doesn't exist, but we test 1.11
//  we still treat this as a JSONAPIAdapter
export default DS.RESTAdapter.extend({
  findAll() {
    return RSVP.Promise.resolve(NUMBERS);
  }
});
