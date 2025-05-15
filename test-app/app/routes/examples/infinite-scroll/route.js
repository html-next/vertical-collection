import { A } from '@ember/array';
import Route from '@ember/routing/route';
import getNumbers from 'test-app/lib/get-numbers';
import { tracked } from '@glimmer/tracking';

class ModelData {
  @tracked data;
}

export default Route.extend({
  model() {
    let model = new ModelData();
    model.data = {
      numbers: A(getNumbers(0, 100)),
      first: 0,
      last: 100
    };
    return model;
  },

  actions: {
    willTransition() {
      this.currentModel = null;
    }
  }
});
