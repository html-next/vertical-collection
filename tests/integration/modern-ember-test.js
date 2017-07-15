import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

import { SUPPORTS_INVERSE_BLOCK } from 'vertical-collection/-private';

import wait from 'dummy/tests/helpers/wait';

if (SUPPORTS_INVERSE_BLOCK) {
  moduleForComponent('vertical-collection', 'Integration | Modern Ember Features Tests', {
    integration: true
  });

  test('Yields to inverse when no content is provided', function(assert) {
    assert.expect(1);
    this.set('items', []);

    this.render(hbs`
      {{#vertical-collection ${'items'}
        estimateHeight=20
        staticHeight=true
      }}
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
