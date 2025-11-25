import { module } from 'qunit';
import { setupRenderingTest } from '../helpers';
import { click, find, findAll, settled } from '@ember/test-helpers';
import scrollTo from '../helpers/scroll-to';

import getNumbers from 'test-app/lib/get-numbers';

import {
  testScenarios,
  scenariosFor,
  standardTemplate,
} from 'test-app/tests/helpers/test-scenarios';

module('vertical-collection', 'Integration | A11y Tests', function (hooks) {
  setupRenderingTest(hooks);

  testScenarios(
    'The collection renders all items when renderAll is set',
    scenariosFor(getNumbers(0, 20), { renderAll: true }),
    standardTemplate,

    async function (assert) {
      assert.equal(
        findAll('.vertical-item').length,
        20,
        'correct number of items rendered',
      );
    },
  );

  testScenarios(
    'The collection can switch on renderAll after being rendered',
    scenariosFor(getNumbers(0, 20)),
    standardTemplate,

    async function (assert) {
      assert.equal(
        findAll('.vertical-item').length,
        10,
        'correct number of items rendered before',
      );

      this.set('renderAll', true);
      await settled(); // Wait for changes

      assert.equal(
        findAll('.vertical-item').length,
        20,
        'correct number of items rendered before',
      );
    },
  );

  testScenarios(
    'The collection renders occluded item labels correctly',
    scenariosFor(getNumbers(0, 20)),
    standardTemplate,

    async function (assert) {
      const occludedBefore = find('.occluded-content:first-of-type');
      const occludedAfter = find('.occluded-content:last-of-type');

      assert.equal(
        occludedBefore.textContent.trim(),
        '',
        'occluded before text correct when no items before',
      );
      assert.equal(
        occludedAfter.textContent.trim(),
        'And 10 items after',
        'occluded after text correct when some items after',
      );

      await scrollTo('.scrollable', 0, 20);

      assert.equal(
        occludedBefore.textContent.trim(),
        'And 1 item before',
        'occluded before text correct when one item before',
      );
      assert.equal(
        occludedAfter.textContent.trim(),
        'And 9 items after',
        'occluded after text correct when some items after',
      );

      await scrollTo('.scrollable', 0, 180);

      assert.equal(
        occludedBefore.textContent.trim(),
        'And 9 items before',
        'occluded before text correct when some items before',
      );
      assert.equal(
        occludedAfter.textContent.trim(),
        'And 1 item after',
        'occluded after text correct when one item after',
      );

      await scrollTo('.scrollable', 0, 200);

      assert.equal(
        occludedBefore.textContent.trim(),
        'And 10 items before',
        'occluded before text correct when some items before',
      );
      assert.equal(
        occludedAfter.textContent.trim(),
        '',
        'occluded after text correct when no items after',
      );
    },
  );

  testScenarios(
    'The collection pages correctly when occluded labels are clicked',
    scenariosFor(getNumbers(0, 20)),
    standardTemplate,

    async function (assert) {
      const occludedBefore = find('.occluded-content:first-of-type');
      const occludedAfter = find('.occluded-content:last-of-type');

      assert.equal(
        find('.vertical-item:first-of-type').textContent.trim(),
        '0 0',
        'correct first item rendered',
      );
      assert.equal(
        find('.vertical-item:last-of-type').textContent.trim(),
        '9 9',
        'correct last item rendered',
      );

      await click(occludedAfter);

      assert.equal(
        find('.vertical-item:first-of-type').textContent.trim(),
        '10 10',
        'correct first item rendered',
      );
      assert.equal(
        find('.vertical-item:last-of-type').textContent.trim(),
        '19 19',
        'correct last item rendered',
      );

      await click(occludedBefore);

      assert.equal(
        find('.vertical-item:first-of-type').textContent.trim(),
        '0 0',
        'correct first item rendered',
      );
      assert.equal(
        find('.vertical-item:last-of-type').textContent.trim(),
        '9 9',
        'correct last item rendered',
      );
    },
  );
});
