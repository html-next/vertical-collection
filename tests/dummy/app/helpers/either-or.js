import Ember from 'ember';

let helper;

if (Ember.Helper) {
  helper = Ember.Helper.helper(function(params) {
    return params[0] || params[1];
  });
} else {
  helper = Ember.Handlebars.makeBoundHelper(function(...params) {
    return params[0] || params[1];
  });
}

export default helper;
