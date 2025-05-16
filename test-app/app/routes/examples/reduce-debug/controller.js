import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class extends Controller {
  @tracked numImages = 50;

  @tracked isFiltered = false;

  @action
  filter() {
    let model = this.model.numbers;
    this.isFiltered = !this.isFiltered;

    if (!this.isFiltered) {
      this.model.set('filtered', model);
    } else {
      let filtered = model.filter((item) => item.number < 25);
      this.model.set('filtered', filtered);
    }
  }
}
