import { module, test } from 'qunit';
import { setupRenderingTest } from '../helpers';
import { hbs } from 'ember-cli-htmlbars';
import { getDeprecationsDuringCallback, render } from '@ember/test-helpers';

const ID = 'vertical-collection.should-recycle-default';

module('Integration | shouldRecycle deprecation', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.set('items', [{ number: 0 }, { number: 1 }]);
  });

  const ids = async (callback) =>
    (await getDeprecationsDuringCallback(callback))
      .map((deprecation) => deprecation.options?.id)
      .filter((id) => id === ID);

  test('Leaving out shouldRecycle logs the deprecation', async function (assert) {
    const found = await ids(() =>
      render(hbs`
        <div style="height: 100px; overflow: auto;">
          <VerticalCollection @items={{this.items}} @estimateHeight={{20}} as |item|>
            <div>{{item.number}}</div>
          </VerticalCollection>
        </div>
      `)
    );

    assert.deepEqual(found, [ID]);
  });

  test('Passing shouldRecycle logs no deprecation', async function (assert) {
    for (const value of [true, false]) {
      this.set('shouldRecycle', value);
      const found = await ids(() =>
        render(hbs`
          <div style="height: 100px; overflow: auto;">
            <VerticalCollection @items={{this.items}} @estimateHeight={{20}} @shouldRecycle={{this.shouldRecycle}} as |item|>
              <div>{{item.number}}</div>
            </VerticalCollection>
          </div>
        `)
      );

      assert.deepEqual(found, [], `@shouldRecycle={{${value}}}`);
    }
  });
});
