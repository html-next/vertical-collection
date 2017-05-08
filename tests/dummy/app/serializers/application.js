import DS from 'ember-data';

let Serializer;

if (DS.JSONAPISerializer) {
  Serializer = DS.JSONAPISerializer.extend({
    normalizeResponse(_, __, payload) {
      return payload;
    }
  });
} else {
  Serializer = DS.RESTSerializer.extend();
}

export default Serializer;
