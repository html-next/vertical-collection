import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { find } from 'ember-native-dom-helpers';
import wait from 'ember-test-helpers/wait';

import { SUPPORTS_INVERSE_BLOCK } from 'ember-compatibility-helpers';

if (SUPPORTS_INVERSE_BLOCK) {
  moduleForComponent('vertical-collection', 'Integration | Modern Ember Features Tests', {
    integration: true
  });

  test('Yields to inverse when no content is provided', async function(assert) {
    assert.expect(1);
    this.set('items', []);

    this.render(hbs`
      {{#vertical-collection items
        estimateHeight=20
        staticHeight=true
      }}
        {{else}}
          Foobar
      {{/vertical-collection}}
    `);

    await wait();

    assert.equal(find('vertical-collection').textContent.indexOf('Foobar') !== -1, true);
  });
}
