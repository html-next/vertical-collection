import Helper, { helper } from '@ember/component/helper';
import Ember from 'ember';

let joinStringsHelper;

if (Helper) {
  joinStringsHelper = helper(function (params) {
    return params.join('');
  });
} else {
  joinStringsHelper = Ember.Handlebars.makeBoundHelper(function (...params) {
    return params.join('');
  });
}

export default joinStringsHelper;
