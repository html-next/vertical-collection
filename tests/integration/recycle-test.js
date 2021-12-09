import { module } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import {
  find,
  findAll,
} from '@ember/test-helpers';
import scrollTo from '../helpers/scroll-to';

import getNumbers from 'dummy/lib/get-numbers';

import {
  testScenarios,

  simpleScenariosFor
} from 'dummy/tests/helpers/test-scenarios';

module('vertical-collection', 'Integration | Recycle Tests', function(hooks) {
  setupRenderingTest(hooks);

  testScenarios(
    'The collection does not recycle when shouldRecycle is set to false',
    simpleScenariosFor(getNumbers(0, 20)),

    hbs`
      <div style="height: 200px" class="scrollable with-max-height">
        <div>
          {{#vertical-collection this.items
            containerSelector=".scrollable"
            estimateHeight=20
            staticHeight=this.staticHeight
            shouldRecycle=false
            bufferSize=0

            as |item i|}}
            <vertical-item style="height: 20px">
              {{unbound item.number}} {{unbound i}}
            </vertical-item>
          {{/vertical-collection}}
        </div>
      </div>
    `,

    async function(assert) {
      assert.expect(2);

      assert.equal(findAll('vertical-item').length, 10);

      await scrollTo('.scrollable', 0, 20);

      assert.equal(find('vertical-item:last-of-type').textContent.trim(), '10 10', 'component was not recycled');
    }
  );

  testScenarios(
    'The collection does recycle when shouldRecycle is set to true',
    simpleScenariosFor(getNumbers(0, 20)),

    hbs`
      <div style="height: 200px" class="scrollable">
        <div>
          {{#vertical-collection this.items
            containerSelector=".scrollable"
            estimateHeight=20
            staticHeight=this.staticHeight
            shouldRecycle=true
            bufferSize=0

            as |item i|}}
            <vertical-item style="height: 20px">
              {{unbound item.number}} {{unbound i}}
            </vertical-item>
          {{/vertical-collection}}
        </div>
      </div>
    `,

    async function(assert) {
      assert.expect(2);

      assert.equal(findAll('vertical-item').length, 10);

      await scrollTo('.scrollable', 0, 20);

      assert.equal(find('vertical-item:last-of-type').textContent.trim(), '0 0', 'component was recycled');
    }
  );
});
