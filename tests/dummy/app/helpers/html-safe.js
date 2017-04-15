import Ember from 'ember';

let helper;

if (Ember.Helper) {
  helper = Ember.Helper.helper(function(params) {
    return Ember.String.htmlSafe(params[0]);
  });
} else {
  helper = Ember.Handlebars.makeBoundHelper(function(...params) {
    return Ember.String.htmlSafe(params[0]);
  });
}

export default helper;
