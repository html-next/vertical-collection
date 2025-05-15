import { module, test } from 'qunit';
import { setupRenderingTest } from '../helpers';
import { hbs } from 'ember-cli-htmlbars';
import { find, render } from '@ember/test-helpers';

module('vertical-collection', 'Integration | Modern Ember Features Tests', function(hooks) {
  setupRenderingTest(hooks);

  test('Yields to inverse when no content is provided', async function(assert) {
    this.set('items', []);

    await render(hbs`
        <div class="scrollable">
          {{#vertical-collection
            items=this.items
            estimateHeight=20
            staticHeight=true
          }}
          {{else}}
            Foobar
          {{/vertical-collection}}
        </div>
      `);

    assert.notStrictEqual(find('.scrollable').textContent.indexOf('Foobar'), -1);
  });
});
