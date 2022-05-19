import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  store: service(),
  prefixed: true,

  actions: {
    updateItems() {
      this.get('store').unloadAll('number-item');
      this.get('store').query('number-item', { length: 5 });
    },

    showPrefixed() {
      this.toggleProperty('prefixed');
    }
  }
});
