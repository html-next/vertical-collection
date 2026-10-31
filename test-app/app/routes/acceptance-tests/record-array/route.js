import Route from '@ember/routing/route';
import * as s from '@ember/service';

const service = s.service ?? s.inject;

export default class extends Route {
  @service() store;

  async model() {
    await this.store.request({ url: '/number-items' });

    return this.store.peekAll('number-item');
  }
}
