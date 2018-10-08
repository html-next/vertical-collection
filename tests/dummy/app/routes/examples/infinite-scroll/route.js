import { A } from '@ember/array';
import Route from '@ember/routing/route';
import getNumbers from 'dummy/lib/get-numbers';

export default Route.extend({
  model() {
    return {
      numbers: A(getNumbers(0, 100)),
      first: 0,
      last: 100
    };
  },

  actions: {
    willTransition() {
      this.set('controller.model.numbers', null);
      this.controller.set('model', null);
      this.set('currentModel', null);
    }
  }
});
