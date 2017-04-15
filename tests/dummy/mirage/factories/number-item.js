import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  number(i) {
    return i;
  }
});
