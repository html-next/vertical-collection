import resolver from './helpers/resolver';
import 'vertical-collection/-debug';
import registerWaiter from 'vertical-collection/test-support/register-waiter';

import {
  setResolver
} from 'ember-qunit';

setResolver(resolver);
registerWaiter();
