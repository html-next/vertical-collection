import Ember from 'ember';

let helper;

if (Ember.Helper) {
  helper = Ember.Helper.helper(function(params) {
    return params.join('');
  });
} else {
  helper = Ember.Handlebars.makeBoundHelper(function(...params) {
    return params.join('');
  });
}

export default helper;
