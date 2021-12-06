import RSVP from 'rsvp';
import JSONAPIAdapter from '@ember-data/adapter/json-api';

const NUMBERS = {
  data: [],
};

for (let i = 0; i < 100; i++) {
  NUMBERS.data.push({
    type: 'number-item',
    id: `${i}`,
    attributes: {
      number: i,
    },
  });
}

export default class ApplicationAdapter extends JSONAPIAdapter {
  findAll() {
    return RSVP.Promise.resolve(NUMBERS);
  }
}
