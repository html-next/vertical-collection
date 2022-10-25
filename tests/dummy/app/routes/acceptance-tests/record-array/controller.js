import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { or } from '@ember/object/computed';

export default Controller.extend({
  store: service(),
  prefixed: true,
  vcShown: true,
  partial: undefined,
  items: or('partial', 'model'),
  firstVisibleId: undefined,

  actions: {
    updateItems() {
      this.store.unloadAll('number-item');
      this.store.query('number-item', { length: 5 });
    },

    showLast(count) {
      let length = this.model.length;
      this.set('partial', this.model.slice(length - count));
    },

    showAll() {
      this.set('partial', undefined);
    },

    showPrefixed() {
      this.toggleProperty('prefixed');
    },

    hideVC() {
      this.set('vcShown', false);
    },

    showVC() {
      this.set('vcShown', true);
    },

    firstVisibleChanged(item) {
      this.set('firstVisibleId', item.id);
    },
  }
});
