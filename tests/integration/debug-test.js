import { moduleForComponent } from 'ember-qunit';
import { find, findAll, scrollTo } from 'ember-native-dom-helpers';

import getNumbers from 'dummy/lib/get-numbers';

import {
  testScenarios,
  scenariosFor,
  standardTemplate,
} from 'dummy/tests/helpers/test-scenarios';

moduleForComponent('vertical-collection', 'Integration | Debug Tests', {
  integration: true,
});

testScenarios(
  'The collection renders the debug visualization when debugVis is set',
  scenariosFor(getNumbers(0, 100), { debugVis: true }),
  standardTemplate,

  async function (assert) {
    assert.ok(
      find('.vertical-collection-visual-debugger', document.body),
      'visualization renders'
    );
    assert.equal(
      findAll('.vc_visualization-virtual-component', document.body).length,
      20,
      'correct number of visualization items rendered'
    );

    await scrollTo('.scrollable', 0, 400);

    assert.equal(
      findAll('.vc_visualization-virtual-component', document.body).length,
      30,
      'correct number of visualization items rendered'
    );

    await scrollTo('.scrollable', 0, 10000);

    assert.equal(
      findAll('.vc_visualization-virtual-component', document.body).length,
      20,
      'correct number of visualization items rendered'
    );
  }
);
