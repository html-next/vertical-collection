import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
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

  this.route('settings');

  // For tests
  this.route('acceptance-tests', function() {
    this.route('record-array');
  });
});

export default Router;
