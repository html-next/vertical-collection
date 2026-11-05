import Route from '@ember/routing/route';
import { makeRows } from './controller';

export default class extends Route {
  model() {
    return makeRows(Number(new URLSearchParams(location.search).get('rows') ?? 10000));
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.items = model;
  }
}
