import JSONAPIAdapter from '@warp-drive/legacy/model';

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

export default class extends JSONAPIAdapter {
  async findAll() {
    return NUMBERS;
  }
  async query(store, model, query) {
    const queryData = { ...NUMBERS };
    queryData.data = NUMBERS.data.slice(0, query.length);
    return queryData;
  }
}
