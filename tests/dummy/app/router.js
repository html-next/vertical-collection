import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {

  this.route('examples', function() {
    this.route('dbmon');
    this.route('infinite-scroll');
    this.route('flexible-layout');
    this.route('scrollable-body');
  });

  this.route('available-components', function() {
    this.route('vertical-collection');
  });

});

export default Router;
