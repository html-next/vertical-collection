import Controller from '@ember/controller';

export default Controller.extend({
  init() {
    this._super(...arguments);

    this.items = [];

    for (let i = 0; i < 1000; i++) {
      this.items.push({ name: `foo${i}` });
    }
  }
});
