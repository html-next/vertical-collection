import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

import wait from 'dummy/tests/helpers/wait';

if (Ember.VERSION >= '1.13.0') {
  moduleForComponent('vertical-collection', 'Integration | Modern Ember Features Tests', {
    integration: true
  });

  test('Yields to inverse when no content is provided', function(assert) {
    assert.expect(1);
    this.set('items', []);

    this.render(hbs`
      {{#vertical-collection ${'items'}}}
        {{else}}
          Foobar
      {{/vertical-collection}}
    `);
    return wait().then(() => {
      const el = this.$('vertical-collection');
      assert.equal(el.html().includes('Foobar'), true);
    });
  });
}
