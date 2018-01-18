import Controller from '@ember/controller';
import Ember from 'ember';
import config from 'dummy/config/environment';

export default Controller.extend({
  version: config.VERSION,
  emberVersion: Ember.VERSION
});
