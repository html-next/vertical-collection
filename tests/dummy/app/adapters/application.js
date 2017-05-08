import DS from 'ember-data';
import Ember from 'ember';

const {
  RSVP
} = Ember;

let Adapter;

// Pre 1.13, the JSONAPIAdapter doesn't exist
if (DS.JSONAPIAdapter) {
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

  Adapter = DS.JSONAPIAdapter.extend({
    findAll() {
      return RSVP.Promise.resolve(NUMBERS);
    }
  });
} else {
  const NUMBERS = {
    numberItems: []
  };

  for (let i = 0; i < 100; i++) {
    NUMBERS.numberItems.push({
      id: `${i}`,
      number: i
    });
  }

  Adapter = DS.RESTAdapter.extend({
    findAll() {
      return RSVP.Promise.resolve(NUMBERS);
    }
  });
}

export default Adapter;
