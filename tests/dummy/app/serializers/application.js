import DS from 'ember-data';

// Pre 1.13, the JSONAPISerializer doesn't exist, but we test 1.11
//  we still treat this as a JSONAPISerializer
export default DS.RESTSerializer.extend({
  normalizeResponse(_, __, payload) {
    return payload;
  }
});
