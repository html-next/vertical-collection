import Helper, { helper } from '@ember/component/helper';
import Ember from 'ember';

let eitherOrHelper;

if (Helper) {
  eitherOrHelper = helper(function (params) {
    return params[0] || params[1];
  });
} else {
  eitherOrHelper = Ember.Handlebars.makeBoundHelper(function (...params) {
    return params[0] || params[1];
  });
}

export default eitherOrHelper;
