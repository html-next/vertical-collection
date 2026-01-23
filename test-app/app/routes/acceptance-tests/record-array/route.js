import Route from '@ember/routing/route';
import * as s from '@ember/service';

const service = s.service ?? s.inject;

export default class extends Route {
  @service() store;

  model() {
    return this.store.findAll('number-item');
  }
}
