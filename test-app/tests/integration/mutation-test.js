import { module } from 'qunit';
import { setupRenderingTest } from '../helpers';
import {
  find,
  findAll,
} from '@ember/test-helpers';
import scrollTo from '../helpers/scroll-to';

import getNumbers from 'test-app/lib/get-numbers';
import {
  testScenarios,
  dynamicSimpleScenarioFor,
  scenariosFor,
  standardTemplate
} from 'test-app/tests/helpers/test-scenarios';

import {
  prepend,
  append,
  emptyArray,
  replaceArray,
  move
} from 'test-app/tests/helpers/array';
import { paddingBefore, paddingAfter } from 'test-app/tests/helpers/measurement';

module('vertical-collection', 'Integration | Mutation Tests', function(hooks) {
  setupRenderingTest(hooks);

  testScenarios(
    'Collection prepends correctly',
    scenariosFor(getNumbers(0, 100)),
    standardTemplate,

    async function(assert) {
      assert.expect(10);

      const scrollContainer = find('.scrollable');

      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '0 0', 'first item rendered correctly before prepend');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '9 9', 'last item rendered correctly before prepnd');
      assert.equal(scrollContainer.scrollTop, 0, 'scrollTop is correct before prepend');
      assert.equal(paddingBefore(scrollContainer), 0, 'padding before is correct before prepend');
      assert.equal(paddingAfter(scrollContainer), 1800, 'padding after is correct before prepend');

      await prepend(this, getNumbers(-20, 20));

      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '0 20', 'first item rendered correctly after prepend');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '9 29', 'last item rendered correctly after prepend');
      assert.equal(scrollContainer.scrollTop, 400, 'scrollTop is correct after prepend');
      assert.equal(paddingBefore(scrollContainer), 400, 'padding before is correct after prepend');
      assert.equal(paddingAfter(scrollContainer), 1800, 'padding after is correct after prepend');
    }
  );

  testScenarios(
    'Collection appends correctly',
    scenariosFor(getNumbers(0, 100)),
    standardTemplate,

    async function(assert) {
      assert.expect(10);

      const scrollContainer = find('.scrollable');

      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '0 0', 'first item rendered correctly before append');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '9 9', 'last item rendered correctly before append');
      assert.equal(scrollContainer.scrollTop, 0, 'scrollTop is correct before append');
      assert.equal(paddingBefore(scrollContainer), 0, 'padding after is correct after append');
      assert.equal(paddingAfter(scrollContainer), 1800, 'padding after is correct before prepend');

      await append(this, getNumbers(100, 20));

      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '0 0', 'first item rendered correctly after append');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '9 9', 'last item rendered correctly after append');
      assert.equal(scrollContainer.scrollTop, 0, 'scrollTop is correct after append');
      assert.equal(paddingBefore(scrollContainer), 0, 'b height is correct after append');
      assert.equal(paddingAfter(scrollContainer), 2200, 'padding after is correct before prepend');
    }
  );

  testScenarios(
    'Collection prepends correctly if prepend would cause more VCs to be shown',
    scenariosFor(getNumbers(0, 10), { bufferSize: 5 }),
    standardTemplate,

    async function(assert) {
      assert.expect(6);

      const scrollContainer = find('.scrollable');

      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '0 0', 'first item rendered correctly before prepend');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '9 9', 'last item rendered correctly before prepend');
      assert.equal(scrollContainer.scrollTop, 0, 'scrollTop is correct before prepend');

      await prepend(this, getNumbers(-5, 5));

      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '-5 0', 'first item rendered correctly after prepend');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '9 14', 'last item rendered correctly after prepend');
      assert.equal(scrollContainer.scrollTop, 100, 'scrollTop is correct after prepend');
    }
  );

  testScenarios(
    'Collection appends correctly if append would cause more VCs to be shown',
    scenariosFor(getNumbers(0, 5)),
    standardTemplate,

    async function(assert) {
      assert.expect(6);

      const scrollContainer = find('.scrollable');

      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '0 0', 'first item rendered correctly before append');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '4 4', 'last item rendered correctly before append');
      assert.equal(scrollContainer.scrollTop, 0, 'scrollTop is correct before append');

      await append(this, getNumbers(5, 5));

      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '0 0', 'first item rendered correctly after append');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '9 9', 'last item rendered correctly after append');
      assert.equal(scrollContainer.scrollTop, 0, 'scrollTop is correct after append');
    }
  );

  testScenarios(
    'Collection can shrink number of items if would cause fewer VCs to be shown',
    scenariosFor(getNumbers(0, 10)),
    standardTemplate,

    async function(assert) {
      assert.expect(6);

      assert.equal(findAll('.vertical-item').length, 10, 'correct number of VCs rendered before reset');
      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '0 0', 'first item rendered correctly before reset');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '9 9', 'last item rendered correctly before reset');

      await replaceArray(this, getNumbers(0, 5));

      assert.equal(findAll('.vertical-item').length, 5, 'correct number of VCs rendered after reset');
      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '0 0', 'first item rendered correctly after reset');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '4 4', 'last item rendered correctly after reset');
    }
  );

  testScenarios(
    'Collection can shrink number of items if would cause fewer VCs to be shown and scroll would change',
    scenariosFor(getNumbers(0, 20)),
    standardTemplate,

    async function(assert) {
      assert.expect(6);

      await scrollTo('.scrollable', 0, 200);

      assert.equal(findAll('.vertical-item').length, 10, 'correct number of VCs rendered before reset');
      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '10 10', 'first item rendered correctly before reset');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '19 19', 'last item rendered correctly before reset');

      await replaceArray(this, getNumbers(0, 5));

      assert.equal(findAll('.vertical-item').length, 5, 'correct number of VCs rendered after reset');
      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '0 0', 'first item rendered correctly before reset');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '4 4', 'last item rendered correctly before reset');
    }
  );

  testScenarios(
    'Collection can shrink number of items to empty collection',
    scenariosFor(getNumbers(0, 10)),
    standardTemplate,

    async function(assert) {
      assert.expect(4);

      assert.equal(findAll('.vertical-item').length, 10, 'correct number of VCs rendered before reset');
      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '0 0', 'first item rendered correctly before reset');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '9 9', 'last item rendered correctly before reset');

      await emptyArray(this);

      assert.equal(findAll('.vertical-item').length, 0, 'correct number of VCs rendered after reset');
    }
  );

  testScenarios(
    'Collection can shrink number of items to empty collection (after scroll has changed)',
    scenariosFor(getNumbers(0, 20)),
    standardTemplate,

    async function(assert) {
      assert.expect(4);

      await scrollTo('.scrollable', 0, 200);

      assert.equal(findAll('.vertical-item').length, 10, 'correct number of VCs rendered before reset');
      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '10 10', 'first item rendered correctly before reset');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '19 19', 'last item rendered correctly before reset');

      await emptyArray(this);

      assert.equal(findAll('.vertical-item').length, 0, 'correct number of VCs rendered after reset');
    }
  );

  testScenarios(
    'Collection will rerender items after reset',
    scenariosFor(getNumbers(0, 10)),
    standardTemplate,

    async function(assert) {
      assert.expect(4);

      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '0 0', 'first item rendered correctly before append');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '9 9', 'last item rendered correctly before append');

      await replaceArray(this, getNumbers(10, 10));

      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '10 0', 'first item rendered correctly after reset');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '19 9', 'last item rendered correctly after reset');
    }
  );

  testScenarios(
    'Dynamic collection maintains state if the same list is passed in twice',
    dynamicSimpleScenarioFor(getNumbers(0, 20), { itemHeight: 40 }),
    standardTemplate,

    async function(assert) {
      assert.expect(4);

      const itemContainer = find('.scrollable');

      // Occlude a single item,
      await scrollTo('.scrollable', 0, 41);

      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '1 1', 'first item rendered correctly after initial scroll set');
      assert.equal(paddingBefore(itemContainer), 40, 'itemContainer padding correct before same items set');

      await replaceArray(this, this.items.slice());

      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '1 1', 'first item rendered correctly after same items set');
      assert.equal(paddingBefore(itemContainer), 40, 'itemContainer padding correct after same items set');
    }
  );

  testScenarios(
    'Collection reorders correctly',
    scenariosFor(getNumbers(0, 5)),
    standardTemplate,

    async function(assert) {
      assert.expect(8);

      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '0 0', 'first item rendered correctly before move');
      assert.equal(find('.vertical-item:nth-of-type(2)').textContent.trim(), '1 1', 'second item starts in second');
      assert.equal(find('.vertical-item:nth-of-type(4)').textContent.trim(), '3 3', 'foruth item starts in fourth');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '4 4', 'last item rendered correctly before move');

      // move second object to the second last position
      await move(this, 1, 3);

      assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '0 0', 'first item rendered correctly after move');
      assert.equal(find('.vertical-item:nth-of-type(2)').textContent.trim(), '2 1', 'third item drops to second');
      assert.equal(find('.vertical-item:nth-of-type(4)').textContent.trim(), '1 3', 'second item is now in fourth position');
      assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '4 4', 'last item rendered correctly before move');
    }
  );
});
