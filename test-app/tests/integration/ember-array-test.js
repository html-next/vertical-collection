import { module, test } from 'qunit';
import { setupRenderingTest } from '../helpers';
import { render, settled, findAll } from '@ember/test-helpers';
import { A } from '@ember/array';
import { standardTemplate } from 'test-app/tests/helpers/test-scenarios';
import getNumbers from 'test-app/lib/get-numbers';

module('vertical-collection', 'Integration | Ember array', function (hooks) {
  setupRenderingTest(hooks);

  // A() is deprecated in Ember, but its changes still reach the collection through the
  // template's read of the length
  test('The collection renders changes made with Ember array methods', async function (assert) {
    const items = A(getNumbers(0, 3));
    this.set('items', items);
    this.set('staticHeight', true);
    await render(standardTemplate);
    assert.strictEqual(
      findAll('.vertical-item').length,
      3,
      'renders the items'
    );

    items.pushObject({ number: 3 });
    await settled();
    assert.strictEqual(
      findAll('.vertical-item').length,
      4,
      'renders an item added with pushObject'
    );

    items.removeObject(items[0]);
    await settled();
    assert.strictEqual(
      findAll('.vertical-item').length,
      3,
      'removes an item removed with removeObject'
    );
    assert.strictEqual(
      findAll('.vertical-item')[0].textContent.trim().split(' ')[0],
      '1',
      'renders the remaining items in order'
    );

    items.replace(1, 1, [{ number: 99 }]);
    await settled();
    assert.ok(
      findAll('.vertical-item').some((e) => e.textContent.includes('99')),
      'renders an item replaced in place'
    );

    items.clear();
    await settled();
    assert.strictEqual(
      findAll('.vertical-item').length,
      0,
      'renders nothing after clear'
    );
  });
});
