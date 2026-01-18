import JSONAPISerializer from '@ember-data/serializer/json-api';

export default JSONAPISerializer.extend({
  normalizeResponse(_, __, payload) {
    return payload;
  },
});
