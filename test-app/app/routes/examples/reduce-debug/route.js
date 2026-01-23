import Route from '@ember/routing/route';
import getNumbers from 'test-app/lib/get-numbers';
import { tracked } from '@glimmer/tracking';

class ModelData {
  @tracked data;
}

export default Route.extend({
  model() {
    let numbers = getNumbers(0, 50);
    let model = new ModelData();
    model.data = {
      numbers,
      first: 0,
      last: 50,
      filtered: numbers,
    };
    return model;
  },

  actions: {
    willTransition() {
      this.currentModel = null;
    },
  },
});
