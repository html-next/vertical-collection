import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

/* eslint-disable ember/no-computed-properties-in-native-classes */
import { or } from '@ember/object/computed';

export default class extends Controller {
  @service() store;
  @tracked prefixed = true;
  @tracked vcShown = true;

  @tracked partial = undefined;
  @or('partial', 'model') items;

  @tracked firstVisibleId = undefined;

  @action
  updateItems() {
    this.store.unloadAll('number-item');
    this.store.query('number-item', { length: 5 });
  }

  @action
  showLast(count) {
    let length = this.model.length;
    this.partial = this.model.slice(length - count);
  }

  @action
  showAll() {
    this.partial = undefined;
  }

  @action
  showPrefixed() {
    this.prefixed = !this.prefixed;
  }

  @action
  hideVC() {
    this.vcShown = false;
  }

  @action
  showVC() {
    this.vcShown = true;
  }

  @action
  firstVisibleChanged(item) {
    this.firstVisibleId = item.id;
  }
}
