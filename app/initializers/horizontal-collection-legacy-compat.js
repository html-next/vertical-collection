import Ember from 'ember';
import HorizontalCollection from '@html-next/virtual-collection/components/horizontal-collection/component';

const { HTMLBars } = Ember;

HTMLBars._registerHelper('horizontal-collection', (params, hash, options, env) => {
  hash.items = params.pop();

  return env.helpers.view.helperFunction.call(this, [HorizontalCollection], hash, options, env);
});

export default {
  name: 'horizontal-collection-legacy-compat',

  initialize() {}
};
