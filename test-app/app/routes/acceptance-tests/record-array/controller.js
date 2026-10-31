import Controller from '@ember/controller';
import { action } from '@ember/object';
import * as s from '@ember/service';
import { tracked } from '@glimmer/tracking';

const service = s.service ?? s.inject;

export default class extends Controller {
  @service store;
  @tracked prefixed = true;
  @tracked vcShown = true;

  @tracked partial = undefined;

  get items() {
    return this.partial || this.model;
  }

  @tracked firstVisibleId = undefined;

  @action
  updateItems() {
    this.store.unloadAll('number-item');
    this.store.request({
      url: '/number-items?length=5',
      cacheOptions: { reload: true },
    });
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
