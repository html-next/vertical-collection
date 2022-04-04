import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { find } from 'ember-native-dom-helpers';
import wait from 'ember-test-helpers/wait';

moduleForComponent('vertical-collection', 'Integration | Modern Ember Features Tests', {
  integration: true
});

test('Yields to inverse when no content is provided', async function(assert) {
  assert.expect(1);
  this.set('items', []);

  this.render(hbs`
      <div class="scrollable">
        {{#vertical-collection items
          estimateHeight=20
          staticHeight=true
        }}
          {{else}}
            Foobar
        {{/vertical-collection}}
      </div>
    `);

  await wait();

  assert.equal(find('.scrollable').textContent.indexOf('Foobar') !== -1, true);
});
