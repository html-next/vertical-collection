import Ember from 'ember';
import wait from 'ember-test-helpers/wait';

export default function() {
  return wait().then(() => {
    return new Ember.RSVP.Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
  });
}
