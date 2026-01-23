import { module, test } from 'qunit';
import { setupRenderingTest } from '../helpers';
import { hbs } from 'ember-cli-htmlbars';
import { find, findAll, settled, render } from '@ember/test-helpers';
import scrollTo from '../helpers/scroll-to';

import getNumbers from 'test-app/lib/get-numbers';

import {
  testScenarios,
  dynamicSimpleScenarioFor,
  staticSimpleScenarioFor,
  simpleScenariosFor,
  scenariosFor,
  standardTemplate,
} from 'test-app/tests/helpers/test-scenarios';

// Assert an odd timing: After initial render but before settledness.
//
async function assertAfterInitialRender(renderFn, assertFn) {
  renderFn();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  assertFn();
}

module('vertical-collection', 'Integration | Basic Tests', function (hooks) {
  setupRenderingTest(hooks);

  testScenarios(
    'The collection renders',
    scenariosFor(getNumbers(0, 1)),
    standardTemplate,

    async function (assert) {
      assert.strictEqual(findAll('.vertical-item').length, 1);
    }
  );

  testScenarios(
    'The collection renders when content is empty',
    scenariosFor([]),
    standardTemplate,

    async function (assert) {
      assert.strictEqual(findAll('.vertical-item').length, 0);
    }
  );

  testScenarios(
    'The collection renders with a key path set',
    scenariosFor([{ id: 1 }, { id: 2 }, { id: 3 }], { key: 'id' }),
    standardTemplate,

    async function (assert) {
      await settled();
      const items = await findAll('.vertical-item');
      assert.strictEqual(items.length, 3);
    }
  );

  testScenarios(
    'The collection renders correct number of components with bufferSize set',
    scenariosFor(getNumbers(0, 10), { estimateHeight: 200, bufferSize: 1 }),
    standardTemplate,

    async function (assert) {
      // Should render buffer on the bottom
      assert.strictEqual(findAll('.vertical-item').length, 2);

      await scrollTo('.scrollable', 0, 200);

      // Should render buffers on both sides
      assert.strictEqual(findAll('.vertical-item').length, 3);

      await scrollTo('.scrollable', 0, 2000);

      // Should render buffer on the top
      assert.strictEqual(findAll('.vertical-item').length, 2);
    }
  );

  testScenarios(
    'The collection renders with containerSelector set',
    simpleScenariosFor(getNumbers(0, 10)),

    hbs`
      <div style="height: 100px;" class="scrollable">
        <div>
          <VerticalCollection @items={{this.items}}
            @containerSelector=".scrollable"
            @estimateHeight={{20}}
            @staticHeight={{true}}
            @bufferSize={{0}}

            as |item i|>
            <vertical-item style="height: 20px">
              {{item.number}} {{i}}
            </vertical-item>
          </VerticalCollection>
        </div>
      </div>
    `,

    async function (assert) {
      assert.strictEqual(findAll('vertical-item').length, 5);
    }
  );

  testScenarios(
    'The collection renders in the correct initial position when offset',
    staticSimpleScenarioFor(getNumbers(0, 10)),

    hbs`
      <div style="height: 100px; padding-top: 50px;" class="scrollable">
        <div>
          <VerticalCollection @items={{this.items}}
            @containerSelector=".scrollable"
            @estimateHeight={{20}}
            @staticHeight={{true}}
            @bufferSize={{0}}

            as |item i|>
            <vertical-item style="height: 20px">
              {{item.number}} {{i}}
            </vertical-item>
          </VerticalCollection>
        </div>
      </div>
    `,

    async function (assert) {
      let occludedBoundaries = findAll('.occluded-content');

      assert.strictEqual(
        occludedBoundaries[0].getAttribute('style'),
        'height: 0px;',
        'Occluded height above is correct'
      );
      assert.strictEqual(
        occludedBoundaries[1].getAttribute('style'),
        'height: 100px;',
        'Occluded height below is correct'
      );
      assert.strictEqual(
        findAll('vertical-item').length,
        5,
        'Rendered correct number of items'
      );
    }
  );

  testScenarios(
    'The collection renders in the correct initial position with dynamic heights',
    dynamicSimpleScenarioFor(getNumbers(0, 10)),

    hbs`
      <div style="position: relative; background: red; box-sizing: content-box; height: 100px; overflow-y: scroll;" class="scrollable">
        <div style="padding: 200px;">
          <VerticalCollection @items={{this.items}}
            @containerSelector=".scrollable"
            @estimateHeight={{20}}
            @bufferSize={{0}}

            as |item i|>
            <vertical-item style="height: 28px">
              {{item.number}} {{i}}
            </vertical-item>
          </VerticalCollection>
        </div>
      </div>
    `,

    async function (assert) {
      let occludedBoundaries = findAll('.occluded-content');

      assert.strictEqual(
        occludedBoundaries[0].getAttribute('style'),
        'height: 0px;',
        'Occluded height above is correct'
      );
      assert.strictEqual(
        occludedBoundaries[1].getAttribute('style'),
        'height: 100px;',
        'Occluded height below is correct'
      );
      assert.strictEqual(
        findAll('vertical-item').length,
        5,
        'Rendered correct number of items'
      );
    }
  );

  testScenarios(
    'The collection renders when yielded item has conditional',
    simpleScenariosFor([{ shouldRender: true }]),

    hbs`
      <div style="height: 500px; width: 500px;">
        <VerticalCollection @items={{this.items}}
          @estimateHeight={{10}}
          @containerSelector="body"
          as |item|
        >
          <div>
            Content
            {{#if item.shouldRender}}
              <section>
                Conditional Content
              </section>
            {{/if}}
          </div>
        </VerticalCollection>
      </div>
    `,

    async function (assert) {
      assert.ok(true, 'No errors were thrown in the process');
    }
  );

  test('The collection renders the initialRenderCount correctly', async function (assert) {
    assert.expect(5);
    this.set('items', getNumbers(0, 10));

    assertAfterInitialRender(
      () => {
        render(hbs`
        <div style="height: 500px; width: 500px;" class="scrollable">
          <VerticalCollection @items={{this.items}}
            @estimateHeight={{50}}
            @initialRenderCount={{1}}
            as |item i|
          >
            <vertical-item style="height: 50px">
              {{item.number}} {{i}}
            </vertical-item>
          </VerticalCollection>
        </div>
      `);
      },
      () => {
        assert.strictEqual(
          findAll('vertical-item').length,
          1,
          'correct number of items rendered on initial pass'
        );
        assert.strictEqual(
          find('vertical-item').textContent.trim(),
          '0 0',
          'correct item rendered'
        );
      }
    );

    await settled();

    assert.strictEqual(
      findAll('vertical-item').length,
      10,
      'correctly updates the number of items rendered on second pass'
    );
    assert.strictEqual(
      find('vertical-item:first-of-type').textContent.trim(),
      '0 0',
      'correct first item rendered'
    );
    assert.strictEqual(
      find('vertical-item:last-of-type').textContent.trim(),
      '9 9',
      'correct last item rendered'
    );
  });

  test('The collection renders the initialRenderCount correctly if idForFirstItem is set', async function (assert) {
    assert.expect(5);
    this.set('items', getNumbers(0, 100));

    assertAfterInitialRender(
      () => {
        render(hbs`
        <div style="height: 500px; width: 500px;" class="scrollable">
          <VerticalCollection @items={{this.items}}
            @estimateHeight={{50}}
            @initialRenderCount={{1}}
            @idForFirstItem="20"
            @key="number"
            as |item i|
          >
            <vertical-item style="height: 50px">
              {{item.number}} {{i}}
            </vertical-item>
          </VerticalCollection>
        </div>
      `);
      },
      () => {
        assert.strictEqual(
          findAll('vertical-item').length,
          1,
          'correct number of items rendered on initial pass'
        );
        assert.strictEqual(
          find('vertical-item').textContent.trim(),
          '20 20',
          'correct item rendered'
        );
      }
    );

    await settled();

    assert.strictEqual(
      findAll('vertical-item').length,
      12,
      'correctly updates the number of items rendered on second pass'
    );
    assert.strictEqual(
      find('vertical-item:first-of-type').textContent.trim(),
      '19 19',
      'correct first item rendered'
    );
    assert.strictEqual(
      find('vertical-item:last-of-type').textContent.trim(),
      '30 30',
      'correct last item rendered'
    );
  });

  test('The collection renders the initialRenderCount correctly if the count is more than the number of items', async function (assert) {
    assert.expect(4);
    this.set('items', getNumbers(0, 1));

    assertAfterInitialRender(
      () => {
        render(hbs`
        <div style="height: 500px; width: 500px;" class="scrollable">
          <VerticalCollection @items={{this.items}}
            @estimateHeight={{50}}
            @initialRenderCount={{5}}
            as |item i|
          >
            <vertical-item style="height: 50px">
              {{item.number}} {{i}}
            </vertical-item>
          </VerticalCollection>
        </div>
      `);
      },
      () => {
        assert.strictEqual(
          findAll('vertical-item').length,
          1,
          'correct number of items rendered on initial pass'
        );
        assert.strictEqual(
          find('vertical-item').textContent.trim(),
          '0 0',
          'correct item rendered'
        );
      }
    );

    await settled();

    assert.strictEqual(
      findAll('vertical-item').length,
      1,
      'correctly updates the number of items rendered on second pass'
    );
    assert.strictEqual(
      find('vertical-item').textContent.trim(),
      '0 0',
      'correct first item rendered'
    );
  });

  testScenarios(
    'The collection renders in the correctly when starting offscreen',
    scenariosFor(getNumbers(0, 100)),

    hbs`
      <div style="height: 100px;" class="scrollable">
        <div style="padding-top: 400px;">
          <VerticalCollection @items={{this.items}}
            @containerSelector=".scrollable"
            @estimateHeight={{20}}
            @bufferSize={{2}}

            as |item i|>
            <vertical-item style="height: 20px">
              {{item.number}} {{i}}
            </vertical-item>
          </VerticalCollection>
        </div>
      </div>
    `,

    async function (assert) {
      assert.expect(2);

      assert.strictEqual(
        findAll('vertical-item').length,
        7,
        'Rendered correct number of items'
      );

      await scrollTo('.scrollable', 0, 500);

      assert.strictEqual(
        findAll('vertical-item').length,
        9,
        'Rendered correct number of items'
      );
    }
  );

  testScenarios(
    'The collection respects initial scroll position when rendered',
    simpleScenariosFor(getNumbers(0, 100)),

    hbs`
      <div class="scrollable" style="height: 500px; width: 500px;">
        <div style="height: 1000px; width: 500px;"></div>

        {{#if this.renderCollection}}
          <VerticalCollection @items={{this.items}} @estimateHeight="20" as |item|>
            <div>
              Content
            </div>
          </VerticalCollection>
        {{/if}}
      </div>
    `,

    async function (assert) {
      let scrollContainer = find('.scrollable');

      await scrollTo('.scrollable', 0, 500);

      assert.strictEqual(
        scrollContainer.scrollTop,
        500,
        'scrolled to correct position'
      );

      this.set('renderCollection', true);

      await settled();

      assert.strictEqual(
        scrollContainer.scrollTop,
        500,
        'scroll position remains the same'
      );
    }
  );
});
