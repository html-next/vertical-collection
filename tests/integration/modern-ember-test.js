import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { find, settled } from '@ember/test-helpers';

module('vertical-collection', 'Integration | Modern Ember Features Tests', function(hooks) {
  setupRenderingTest(hooks);

  test('Yields to inverse when no content is provided', async function(assert) {
    assert.expect(1);
    this.set('items', []);

    this.render(hbs`
        <div class="scrollable">
          {{#vertical-collection this.items
            estimateHeight=20
            staticHeight=true
          }}
            {{else}}
              Foobar
          {{/vertical-collection}}
        </div>
      `);

    await settled();

    assert.equal(find('.scrollable').textContent.indexOf('Foobar') !== -1, true);
  });
});
