import Ember from 'ember';
import VerticalCollection from '@html-next/virtual-collection/components/vertical-collection/component';

const { HTMLBars } = Ember;

HTMLBars._registerHelper('vertical-collection', (params, hash, options, env) => {
  hash.items = params.pop();

  return env.helpers.view.helperFunction.call(this, [VerticalCollection], hash, options, env);
});

export default {
  name: 'vertical-collection-legacy-compat',

  initialize() {}
};
