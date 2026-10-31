import { module, test } from 'qunit';
import { findAll, render } from '@ember/test-helpers';
import { setupRenderingTest } from '../helpers';
import { VerticalCollection } from '@html-next/vertical-collection';

const rows = [{ id: 'a', name: 'A' }];

// lint:types fails if one of these stops being a type error
const typeErrors = <template>
  <VerticalCollection @items={{rows}} @estimateHeight={{20}} as |row|>
    {{! @glint-expect-error: the rows have no missing field }}
    {{row.missing}}
  </VerticalCollection>

  {{! @glint-expect-error: @estimateHeight is required }}
  <VerticalCollection @items={{rows}} />

  {{! @glint-expect-error: @bad is not an argument }}
  <VerticalCollection @items={{rows}} @estimateHeight={{20}} @bad={{1}} />
</template>;

module('Integration | Types', function (hooks) {
  setupRenderingTest(hooks);

  test('The block gets each item with the type of the items', async function (assert) {
    await render(
      <template>
        <div style="height: 100px;">
          <VerticalCollection
            @items={{rows}}
            @estimateHeight={{20}}
            as |row index|
          >
            <div class="typed-row" style="height: 20px;">{{row.name}}
              {{index}}</div>
          </VerticalCollection>
        </div>
      </template>
    );

    assert.deepEqual(
      findAll('.typed-row').map((element) =>
        element.textContent?.replace(/\s+/g, ' ').trim()
      ),
      ['A 0']
    );
  });

  test('The template with type errors is a component', function (assert) {
    assert.ok(typeErrors);
  });
});
