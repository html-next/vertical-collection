import { module } from 'qunit';
import { setupRenderingTest } from '../helpers';
import scrollTo from '../helpers/scroll-to';

import getNumbers from 'test-app/lib/get-numbers';

import {
  testScenarios,
  scenariosFor,
  standardScenariosFor,
  standardTemplate,
} from 'test-app/tests/helpers/test-scenarios';

module('vertical-collection', 'Integration | Debug Tests', function (hooks) {
  setupRenderingTest(hooks);

  testScenarios(
    'The collection renders the debug visualization when debugVis is set',
    scenariosFor(getNumbers(0, 100), { debugVis: true }),
    standardTemplate,

    async function (assert) {
      assert.ok(
        document.querySelector('.vertical-collection-visual-debugger'),
        'visualization renders'
      );
      assert.equal(
        document.querySelectorAll('.vc_visualization-virtual-component').length,
        20,
        'correct number of visualization items rendered'
      );

      await scrollTo('.scrollable', 0, 400);

      assert.equal(
        document.querySelectorAll('.vc_visualization-virtual-component').length,
        30,
        'correct number of visualization items rendered'
      );

      await scrollTo('.scrollable', 0, 10000);

      assert.equal(
        document.querySelectorAll('.vc_visualization-virtual-component').length,
        20,
        'correct number of visualization items rendered'
      );
    }
  );

  testScenarios(
    'The collection checks the CSS without errors when debugCSS is set',
    standardScenariosFor(getNumbers(0, 100), {
      debugVis: true,
      debugCSS: true,
    }),
    standardTemplate,

    async function (assert) {
      const { getComputedStyle } = window;
      let checks = 0;

      window.getComputedStyle = (element, ...rest) => {
        if (element.classList.contains('occluded-content')) checks++;
        return getComputedStyle.call(window, element, ...rest);
      };

      try {
        await scrollTo('.scrollable', 0, 400);
      } finally {
        window.getComputedStyle = getComputedStyle;
      }

      assert.true(
        checks > 0,
        'the CSS of the first element in the item container is checked'
      );
    }
  );
});
