import { useRecommendedStore } from '@warp-drive/core';
import { withDefaults } from '@warp-drive/core/reactive';
import { Type } from '@warp-drive/core/types/symbols';
import { JSONAPICache } from '@warp-drive/json-api';

const NUMBERS = Array.from({ length: 100 }, (_, i) => ({
  type: 'number-item',
  id: `${i}`,
  attributes: { number: i },
}));

// Serves `/number-items`, and the first `length` numbers for `/number-items?length=`
const NumbersHandler = {
  request({ request }) {
    const { searchParams } = new URL(request.url, window.location.origin);
    const length = Number(searchParams.get('length') ?? NUMBERS.length);

    return Promise.resolve({ data: NUMBERS.slice(0, length) });
  },
};

function prefixed(record) {
  return `${record.number}`;
}
prefixed[Type] = 'prefixed';

export default useRecommendedStore({
  cache: JSONAPICache,
  handlers: [NumbersHandler],
  derivations: [prefixed],
  schemas: [
    withDefaults({
      type: 'number-item',
      fields: [
        { name: 'number', kind: 'field' },
        { name: 'prefixed', kind: 'derived', type: 'prefixed' },
      ],
    }),
  ],
});
