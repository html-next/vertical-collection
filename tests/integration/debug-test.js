import { module } from 'qunit';
import { setupRenderingTest } from '../helpers';
import scrollTo from '../helpers/scroll-to';

import getNumbers from 'dummy/lib/get-numbers';

import {
  testScenarios,
  scenariosFor,
  standardTemplate
} from 'dummy/tests/helpers/test-scenarios';

module('vertical-collection', 'Integration | Debug Tests', function(hooks) {
  setupRenderingTest(hooks);

  testScenarios(
    'The collection renders the debug visualization when debugVis is set',
    scenariosFor(getNumbers(0, 100), { debugVis: true }),
    standardTemplate,

    async function(assert) {
      assert.ok(document.querySelector('.vertical-collection-visual-debugger'), 'visualization renders');
      assert.equal(document.querySelectorAll('.vc_visualization-virtual-component').length, 20, 'correct number of visualization items rendered');

      await scrollTo('.scrollable', 0, 400);

      assert.equal(document.querySelectorAll('.vc_visualization-virtual-component').length, 30, 'correct number of visualization items rendered');

      await scrollTo('.scrollable', 0, 10000);

      assert.equal(document.querySelectorAll('.vc_visualization-virtual-component').length, 20, 'correct number of visualization items rendered');
    }
  );
});
