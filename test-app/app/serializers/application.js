import JSONAPISerializer from '@warp-drive/legacy/model';

export default JSONAPISerializer.extend({
  normalizeResponse(_, __, payload) {
    return payload;
  },
});
