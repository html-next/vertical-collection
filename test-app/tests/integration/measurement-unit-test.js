import { module } from 'qunit';
import { setupRenderingTest } from '../helpers';
import { hbs } from 'ember-cli-htmlbars';
import {
  findAll
} from '@ember/test-helpers';

import getNumbers from 'test-app/lib/get-numbers';

import {
  testScenarios,

  simpleScenariosFor,
  scenariosFor
} from 'test-app/tests/helpers/test-scenarios';

module('vertical-collection', 'Integration | Measurement Unit Tests', function(hooks) {
  setupRenderingTest(hooks);

  testScenarios(
    'The collection renders correctly when em estimateHeight is used',
    scenariosFor(getNumbers(0, 10)),

    hbs`
      <div style="height: 100px; font-size: 10px;" class="scrollable">
        <VerticalCollection @items={{this.items}}
          @estimateHeight="2em"
          @staticHeight={{this.staticHeight}}
          @bufferSize={{0}}

          as |item i|>
          <vertical-item style="height: 2em">
            {{item.number}} {{i}}
          </vertical-item>
        </VerticalCollection>
      </div>
    `,

    async function(assert) {
      assert.strictEqual(findAll('vertical-item').length, 5);
    }
  );

  testScenarios(
    'The collection renders correctly when rem estimateHeight is used',
    scenariosFor(getNumbers(0, 10)),

    hbs`
      <div style="height: 100px; font-size: 10px;" class="scrollable">
        <VerticalCollection @items={{this.items}}
          @estimateHeight="2rem"
          @staticHeight={{this.staticHeight}}
          @bufferSize={{0}}

          as |item i|>
          <vertical-item style="height: 2rem">
            {{item.number}} {{i}}
          </vertical-item>
        </VerticalCollection>
      </div>
    `,

    async function(assert) {
      assert.strictEqual(findAll('vertical-item').length, 5);
    }
  );

  testScenarios(
    'The collection renders correctly when percent estimateHeight is used',
    scenariosFor(getNumbers(0, 10)),

    hbs`
      <div style="height: 100px;" class="scrollable">
        <VerticalCollection @items={{this.items}}
          @estimateHeight="66%"
          @staticHeight={{this.staticHeight}}
          @bufferSize={{0}}

          as |item i|>
          <vertical-item style="height: 66%">
            {{item.number}} {{i}}
          </vertical-item>
        </VerticalCollection>
      </div>
    `,

    async function(assert) {
      assert.equal(findAll('vertical-item').length, 2);
    }
  );

  testScenarios(
    'The collection renders correctly when em height is used',
    scenariosFor(getNumbers(0, 10)),

    hbs`
      <div style="height: 100px; font-size: 10px;" class="scrollable">
        <VerticalCollection @items={{this.items}}
          @estimateHeight="2em"
          @staticHeight={{this.staticHeight}}
          @bufferSize={{0}}

          as |item i|>
          <vertical-item style="height: 2em">
            {{item.number}} {{i}}
          </vertical-item>
        </VerticalCollection>
      </div>
    `,

    async function(assert) {
      assert.strictEqual(findAll('vertical-item').length, 5);
    }
  );

  testScenarios(
    'The collection renders correctly with a scroll parent with a pixel based max height',
    simpleScenariosFor(getNumbers(0, 20)),

    hbs`
      <div class="scrollable with-pixel-max-height">
        <div>
          <VerticalCollection @items={{this.items}}
            @containerSelector=".scrollable"
            @estimateHeight={{20}}
            @staticHeight={{this.staticHeight}}
            @bufferSize={{0}}

            as |item i|>
            <vertical-item style="height: 20px">
              {{item.number}} {{i}}
            </vertical-item>
          </VerticalCollection>
        </div>
      </div>
    `,

    function(assert) {
      assert.strictEqual(findAll('vertical-item').length, 10);
    }
  );

  testScenarios(
    'The collection renders correctly with a scroll parent with a percentage based max height',
    simpleScenariosFor(getNumbers(0, 20)),

    hbs`
      <div style="height: 400px;">
        <div class="scrollable with-percent-max-height">
          <div>
            <VerticalCollection @items={{this.items}}
              @containerSelector=".scrollable"
              @estimateHeight={{20}}
              @staticHeight={{this.staticHeight}}
              @bufferSize={{0}}

              as |item i|>
              <vertical-item style="height: 20px">
                {{item.number}} {{i}}
              </vertical-item>
            </VerticalCollection>
          </div>
        </div>
      </div>
    `,

    function(assert) {
      assert.strictEqual(findAll('vertical-item').length, 10);
    }
  );

  testScenarios(
    'The collection renders correctly with a scroll parent with an em based max height',
    simpleScenariosFor(getNumbers(0, 20)),

    hbs`
      <div style="font-size: 20px;">
        <div class="scrollable with-em-max-height">
          <div>
            <VerticalCollection @items={{this.items}}
              @containerSelector=".scrollable"
              @estimateHeight={{20}}
              @staticHeight={{this.staticHeight}}
              @bufferSize={{0}}

              as |item i|>
              <vertical-item style="height: 20px">
                {{item.number}} {{i}}
              </vertical-item>
            </VerticalCollection>
          </div>
        </div>
      </div>
    `,

    function(assert) {
      assert.strictEqual(findAll('vertical-item').length, 10);
    }
  );

  testScenarios(
    'The collection renders correctly with a scroll parent with a rem based max height',
    simpleScenariosFor(getNumbers(0, 20)),

    hbs`
      <div class="scrollable with-rem-max-height">
        <div>
          <VerticalCollection @items={{this.items}}
            @containerSelector=".scrollable"
            @estimateHeight={{20}}
            @staticHeight={{this.staticHeight}}
            @bufferSize={{0}}

            as |item i|>
            <vertical-item style="height: 20px">
              {{item.number}} {{i}}
            </vertical-item>
          </VerticalCollection>
        </div>
      </div>
    `,

    function(assert) {
      assert.strictEqual(findAll('vertical-item').length, 10);
    }
  );
});
