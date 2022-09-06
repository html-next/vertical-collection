import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  store: service(),
  prefixed: true,
  vcShown: true,

  actions: {
    updateItems() {
      this.get('store').unloadAll('number-item');
      this.get('store').query('number-item', { length: 5 });
    },

    partialUpdate() {
      let length = this.model.content.length;
      this.set('model', this.model.toArray().removeAt(0, length - 5));
    },

    showPrefixed() {
      this.toggleProperty('prefixed');
    },

    hideVC() {
      this.set('vcShown', false);
    },

    showVC() {
      this.set('vcShown', true);
    }
  }
});
