import { useLegacyStore } from '@warp-drive/legacy';
import { JSONAPICache } from '@warp-drive/json-api';

export default useLegacyStore({
  linksMode: false,
  legacyRequests: true,
  modelFragments: true,
  cache: JSONAPICache,
  schemas: [
    // -- your schemas here
  ],
});
