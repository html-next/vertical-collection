import Route from '@ember/routing/route';
import getNumbers from 'dummy/lib/get-numbers';

export default Route.extend({

  model() {
    let numbers = getNumbers(0, 50);
    return {
      data: {
        numbers,
        first: 0,
        last: 50,
        filtered: numbers
      }
    };
  },

  actions: {
    willTransition() {
      this.currentModel = null;
    }
  }

});
