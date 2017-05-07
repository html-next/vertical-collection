import DS from 'ember-data';
import RSVP from 'rsvp';

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

export default DS.JSONAPIAdapter.extend({
  findAll() {
    return RSVP.Promise.resolve(NUMBERS);
  }
});
