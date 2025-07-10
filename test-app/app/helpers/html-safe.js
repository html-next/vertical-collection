import { htmlSafe } from '@ember/template';
import Helper, { helper } from '@ember/component/helper';
import Ember from 'ember';

let htmlSafeHelper;

if (Helper) {
  htmlSafeHelper = helper(function (params) {
    return htmlSafe(params[0]);
  });
} else {
  htmlSafeHelper = Ember.Handlebars.makeBoundHelper(function (...params) {
    return htmlSafe(params[0]);
  });
}

export default htmlSafeHelper;
