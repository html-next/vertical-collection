import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class extends Controller {
  @tracked numImages = 50;

  @tracked isFiltered = false;

  @action
  filter() {
    let numbers = this.model.data.numbers;
    this.isFiltered = !this.isFiltered;

    if (!this.isFiltered) {
      this.model.data = {
        ...this.model.data,
        filtered: numbers,
      };
    } else {
      let filtered = numbers.filter((item) => item.number < 25);
      this.model.data = {
        ...this.model.data,
        filtered,
      };
    }
  }
}
