import Ember from 'ember';
import { scheduler } from 'vertical-collection/-private';

export default function registerWaiter() {
  Ember.Test.registerWaiter(function() {
    return scheduler.jobs === 0;
  });
}
