import Ember from 'ember';

const { inject: { service } } = Ember;

export default Ember.Route.extend({
  store: service(),

  model() {
    return this.get('store').findAll('number-item');
  }
});
