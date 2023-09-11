import Controller from '@ember/controller';
import getNumbers from 'dummy/lib/get-numbers';

export default Controller.extend({

  numImages: 5,

  someProperty: 50,

  actions: {

    loadAbove() {
      let first = this.model.data.first;
      let numbers = getNumbers(first - 20, 20);
      let model = this.model.data.numbers;
      model.unshiftObjects(numbers);
      // this.set('model.numbers', newModel);
      this.set('model.data.first', first - 20);
    },

    loadBelow() {
      let last = this.model.data.last;
      let numbers = getNumbers(last, 20);
      let model = this.model.data.numbers;
      model.pushObjects(numbers);
      // this.set('model.numbers', newModel);
      this.set('model.data.last', last + 20);
    }
  }
});
