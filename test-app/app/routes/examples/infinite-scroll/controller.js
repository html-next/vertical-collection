import Controller from '@ember/controller';
import getNumbers from 'test-app/lib/get-numbers';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class extends Controller {
  @tracked numImages = 5;
  @tracked someProperty = 50;

  @action
  loadAbove() {
    let first = this.model.data.first;
    let numbers = getNumbers(first - 20, 20);
    let model = this.model.data.numbers;
    model.unshiftObjects(numbers);
    this.model.data.first = first - 20;
  }

  @action
  loadBelow() {
    let last = this.model.data.last;
    let numbers = getNumbers(last, 20);
    let model = this.model.data.numbers;
    model.pushObjects(numbers);
    this.model.data.last = last + 20;
  }
}
