import { module } from 'qunit';
import { setupRenderingTest } from '../helpers';
import { hbs } from 'ember-cli-htmlbars';

import {
  find,
  findAll,
} from '@ember/test-helpers';
import scrollTo from '../helpers/scroll-to';

import getNumbers from 'test-app/lib/get-numbers';

import { paddingBefore, paddingAfter } from 'test-app/tests/helpers/measurement';
import { prepend, replaceArray } from 'test-app/tests/helpers/array';

import {
  testScenarios,
  dynamicSimpleScenarioFor,
  standardTemplate
} from 'test-app/tests/helpers/test-scenarios';

module('vertical-collection', 'Integration | Measure Tests', function(hooks) {
  setupRenderingTest(hooks);

  testScenarios(
    'The collection correctly remeasures items when scrolling down',
    dynamicSimpleScenarioFor(getNumbers(0, 20)),
    standardTemplate,

    async function(assert) {
      assert.expect(2);

      const itemContainer = find('.scrollable');
      assert.equal(paddingBefore(itemContainer), 0, 'itemContainer padding is correct on initial render');

      find('.vertical-item:first-of-type').style.height = '50px';

      await scrollTo('.scrollable', 0, 51);

      assert.equal(paddingBefore(itemContainer), 50, 'itemContainer padding is the height of the modified first element');
    }
  );

  testScenarios(
    'The collection correctly remeasures items when scrolling up',
    dynamicSimpleScenarioFor(getNumbers(0, 20)),
    standardTemplate,

    async function(assert) {
      assert.expect(3);

      const itemContainer = find('.scrollable');

      assert.equal(paddingAfter(itemContainer), 200, 'itemContainer padding is correct on initial render');

      await scrollTo('.scrollable', 0, 20);

      assert.equal(paddingAfter(itemContainer), 180, 'itemContainer padding is correct after scrolling down');

      find('.vertical-item:last-of-type').style.height = '50px';
      await scrollTo('.scrollable', 0, 0);

      assert.equal(paddingAfter(itemContainer), 230, 'itemContainer padding has the height of the modified last element');
    }
  );

  testScenarios(
    'Can scroll correctly in dynamic list of items that has non-integer heights',
    dynamicSimpleScenarioFor(getNumbers(0, 20), { itemHeight: 20.5 }),
    standardTemplate,

    async function(assert) {
      assert.expect(2);

      await scrollTo('.scrollable', 0, 400);

      const itemContainer = find('.scrollable');

      // Floats aren't perfect, neither is browser rendering/measuring, but any subpixel errors
      // should be amplified to the point where they are very noticeable at this point, so rounding
      // should provide some safety.
      assert.equal(Math.round(paddingBefore(itemContainer)), 205, 'Occluded content has the correct height before');
      assert.equal(paddingAfter(itemContainer), 0, 'Occluded content has the correct height after');
    }
  );

  testScenarios(
    'Can measure and affect correctly in list of items with non-integer heights',
    dynamicSimpleScenarioFor(getNumbers(0, 20), { itemHeight: 30.1, key: '@index', idForFirstItem: '10', bufferSize: 1 }),
    standardTemplate,

    async function(assert) {
      assert.expect(1);

      assert.equal(find('.scrollable').scrollTop, 210, 'scrollTop set to correct value');
    }
  );

  testScenarios(
    'Measurements are correct after a prepend',
    dynamicSimpleScenarioFor(getNumbers(0, 20), { itemHeight: 40 }),
    standardTemplate,

    async function(assert) {
      assert.expect(3);

      await prepend(this, getNumbers(-20, 20));

      assert.equal(find('.scrollable').scrollTop, 400, 'scrollTop set to correct value');

      const itemContainer = find('.scrollable');
      assert.equal(paddingBefore(itemContainer), 400, 'Occluded content has the correct height before');
      assert.equal(paddingAfter(itemContainer), 400, 'Occluded content has the correct height after');
    }
  );

  testScenarios(
    'Measurements are correct after a reset',
    dynamicSimpleScenarioFor(getNumbers(0, 20), { itemHeight: 40 }),
    standardTemplate,

    async function(assert) {
      assert.expect(6);

      await scrollTo('.scrollable', 0, 400);

      assert.equal(find('.scrollable').scrollTop, 400, 'scrollTop set to correct value');
      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '10 10', 'the first rendered item is correct');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '19 19', 'the last rendered item is correct');

      // Trigger measurements
      await scrollTo('.scrollable', 0, 420);
      await scrollTo('.scrollable', 0, 400);

      await replaceArray(this, getNumbers(20, 20));

      assert.equal(find('.scrollable').scrollTop, 400, 'scrollTop set to correct value');
      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '30 10', 'the first rendered item is correct');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '34 14', 'the last rendered item is correct');
    }
  );

  testScenarios(
    'The collection renders correctly when scaled',
    dynamicSimpleScenarioFor(getNumbers(0, 100)),

    hbs`
      <div style="transform: scale(0.333333)">
        <div style="height: 100px" class="scrollable">
          <VerticalCollection @items={{this.items}}
            @estimateHeight={{20}}
            @bufferSize={{0}}

            as |item i|>
            <vertical-item style="height: 30px">
              {{item.number}} {{i}}
            </vertical-item>
          </VerticalCollection>
        </div>
      </div>
    `,

    async function(assert) {
      await scrollTo('.scrollable', 0, 150);

      assert.equal(paddingBefore(find('.scrollable')), 150, 'Rendered correct number of items');
    }
  );

  testScenarios(
    'The collection shrinks the pool if items are much larger than expected',
    dynamicSimpleScenarioFor(getNumbers(0, 20), { estimateHeight: 20, itemHeight: 200 }),
    standardTemplate,

    async function(assert) {
      await scrollTo('.scrollable', 0, 20);
      await scrollTo('.scrollable', 0, 0);

      assert.equal(findAll('.vertical-item').length, 1, 'scrollTop set to correct value');
      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '0 0', 'the last rendered item is correct');
    }
  );

  testScenarios(
    'The collection renders incrementally until the entire scroll container is covered',
    dynamicSimpleScenarioFor(getNumbers(0, 20), { estimateHeight: 200, itemHeight: 20 }),
    standardTemplate,

    async function(assert) {
      assert.equal(findAll('.vertical-item').length, 10, 'scrollTop set to correct value');
      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '0 0', 'the first rendered item is correct');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '9 9', 'the last rendered item is correct');
    }
  );
});
