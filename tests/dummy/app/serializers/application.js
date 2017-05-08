import DS from 'ember-data';

export default DS.JSONAPISerializer.extend({
  normalizeResponse(_, __, payload) {
    return payload;
  }
});
