import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import {
  find,
  findAll,
  scrollTo
} from 'ember-native-dom-helpers';

import getNumbers from 'dummy/lib/get-numbers';

import waitForRender from 'dummy/tests/helpers/wait-for-render';
import {
  testScenarios,

  dynamicSimpleScenarioFor,
  staticSimpleScenarioFor,
  simpleScenariosFor,
  scenariosFor,
  standardTemplate
} from 'dummy/tests/helpers/test-scenarios';

moduleForComponent('vertical-collection', 'Integration | Basic Tests', {
  integration: true
});

testScenarios(
  'The collection Renders',
  scenariosFor(getNumbers(0, 1)),
  standardTemplate,

  async function(assert) {
    assert.expect(1);
    assert.equal(findAll('.vertical-item').length, 1);
  }
);

testScenarios(
  'The collection Renders when content is empty',
  scenariosFor([]),
  standardTemplate,

  async function(assert) {
    assert.expect(1);
    assert.equal(findAll('.vertical-item').length, 0);
  }
);

testScenarios(
  'The collection renders with a key path set',
  scenariosFor([{ id: 1 }, { id: 2 }, { id: 3 }], { key: 'id' }),
  standardTemplate,

  async function(assert) {
    assert.expect(1);
    assert.equal(findAll('.vertical-item').length, 3);
  }
);

testScenarios(
  'The collection renders correct number of components with bufferSize set',
  scenariosFor(getNumbers(0, 10), { estimateHeight: 200, bufferSize: 1 }),
  standardTemplate,

  async function(assert) {
    assert.expect(3);

    // Should render 2 components to be able to cover the whole scroll space, and 1
    // extra buffer component on the bottom
    assert.equal(findAll('.vertical-item').length, 2);

    await scrollTo('.scrollable', 0, 200);

    // Should render a buffer on both sides
    assert.equal(findAll('.vertical-item').length, 3);

    await scrollTo('.scrollable', 0, 2000);

    // Back to 3 items because at the bottom
    assert.equal(findAll('.vertical-item').length, 2);
  }
);

testScenarios(
  'The collection renders with containerSelector set',
  simpleScenariosFor(getNumbers(0, 10)),

  hbs`
    <div style="height: 100px;" class="scrollable">
      <div>
        {{#vertical-collection ${'items'}
          containerSelector=".scrollable"
          estimateHeight=20
          staticHeight=true
          bufferSize=0

          as |item i|}}
          <vertical-item style="height: 20px">
            {{item.number}} {{i}}
          </vertical-item>
        {{/vertical-collection}}
      </div>
    </div>
  `,

  async function(assert) {
    assert.expect(1);
    assert.equal(findAll('vertical-item').length, 5);
  }
);

testScenarios(
  'The collection renders in the correct initial position when offset',
  staticSimpleScenarioFor(getNumbers(0, 10)),

  hbs`
    <div style="height: 100px; padding-top: 50px;" class="scrollable">
      <div>
        {{#vertical-collection ${'items'}
          containerSelector=".scrollable"
          estimateHeight=20
          staticHeight=true
          bufferSize=0

          as |item i|}}
          <vertical-item style="height: 20px">
            {{item.number}} {{i}}
          </vertical-item>
        {{/vertical-collection}}
      </div>
    </div>
  `,

  async function(assert) {
    assert.expect(3);

    let occludedBoundaries = findAll('occluded-content');

    assert.equal(occludedBoundaries[0].getAttribute('style'), 'height: 0px;', 'Occluded height above is correct');
    assert.equal(occludedBoundaries[1].getAttribute('style'), 'height: 100px;', 'Occluded height below is correct');
    assert.equal(findAll('vertical-item').length, 5, 'Rendered correct number of items');
  }
);

testScenarios(
  'The collection renders in the correct initial position with dynamic heights',
  dynamicSimpleScenarioFor(getNumbers(0, 10)),

  hbs`
    <div style="position: relative; background: red; box-sizing: content-box; height: 100px; overflow-y: scroll;" class="scrollable">
      <div style="padding: 200px;">
        {{#vertical-collection ${'items'}
          containerSelector=".scrollable"
          estimateHeight=20
          bufferSize=0

          as |item i|}}
          <vertical-item style="height: 28px">
            {{item.number}} {{i}}
          </vertical-item>
        {{/vertical-collection}}
      </div>
    </div>
  `,

  async function(assert) {
    assert.expect(3);

    let occludedBoundaries = findAll('occluded-content');

    assert.equal(occludedBoundaries[0].getAttribute('style'), 'height: 0px;', 'Occluded height above is correct');
    assert.equal(occludedBoundaries[1].getAttribute('style'), 'height: 100px;', 'Occluded height below is correct');
    assert.equal(findAll('vertical-item').length, 5, 'Rendered correct number of items');
  }
);

testScenarios(
  'The collection renders when yielded item has conditional',
  simpleScenariosFor([{ shouldRender: true }]),

  hbs`
    <div style="height: 500px; width: 500px;">
      {{#vertical-collection ${'items'}
        estimateHeight=10
        containerSelector="body"
        as |item|
      }}
        <div>
          Content
          {{#if item.shouldRender}}
            <section>
              Conditional Content
            </section>
          {{/if}}
        </div>
      {{/vertical-collection}}
    </div>
  `,

  async function(assert) {
    assert.ok(true, 'No errors were thrown in the process');
  }
);

test('The collection renders the initialRenderCount correctly', async function(assert) {
  assert.expect(5);
  this.set('items', getNumbers(0, 10));

  this.render(hbs`
    <div style="height: 500px; width: 500px;" class="scrollable">
      {{#vertical-collection ${'items'}
        estimateHeight=50
        initialRenderCount=1
        as |item i|
      }}
        <vertical-item style="height: 50px">
          {{item.number}} {{i}}
        </vertical-item>
      {{/vertical-collection}}
    </div>
  `);

  requestAnimationFrame(() => {
    assert.equal(findAll('vertical-item').length, 1, 'correct number of items rendered on initial pass');
    assert.equal(find('vertical-item').textContent.trim(), '0 0', 'correct item rendered');
  });

  await waitForRender();

  assert.equal(findAll('vertical-item').length, 10, 'correctly updates the number of items rendered on second pass');
  assert.equal(find('vertical-item:first-of-type').textContent.trim(), '0 0', 'correct first item rendered');
  assert.equal(find('vertical-item:last-of-type').textContent.trim(), '9 9', 'correct last item rendered');
});

test('The collection renders the initialRenderCount correctly if idForFirstItem is set', async function(assert) {
  assert.expect(5);
  this.set('items', getNumbers(0, 100));

  this.render(hbs`
    <div style="height: 500px; width: 500px;" class="scrollable">
      {{#vertical-collection ${'items'}
        estimateHeight=50
        initialRenderCount=1
        idForFirstItem="20"
        key="number"
        as |item i|
      }}
        <vertical-item style="height: 50px">
          {{item.number}} {{i}}
        </vertical-item>
      {{/vertical-collection}}
    </div>
  `);

  requestAnimationFrame(() => {
    assert.equal(findAll('vertical-item').length, 1, 'correct number of items rendered on initial pass');
    assert.equal(find('vertical-item').textContent.trim(), '20 20', 'correct item rendered');
  });

  await waitForRender();

  assert.equal(findAll('vertical-item').length, 12, 'correctly updates the number of items rendered on second pass');
  assert.equal(find('vertical-item:first-of-type').textContent.trim(), '19 19', 'correct first item rendered');
  assert.equal(find('vertical-item:last-of-type').textContent.trim(), '30 30', 'correct last item rendered');
});

test('The collection renders the initialRenderCount correctly if the count is more than the number of items', async function(assert) {
  assert.expect(4);
  this.set('items', getNumbers(0, 1));

  this.render(hbs`
    <div style="height: 500px; width: 500px;" class="scrollable">
      {{#vertical-collection ${'items'}
        estimateHeight=50
        initialRenderCount=5
        as |item i|
      }}
        <vertical-item style="height: 50px">
          {{item.number}} {{i}}
        </vertical-item>
      {{/vertical-collection}}
    </div>
  `);

  requestAnimationFrame(() => {
    assert.equal(findAll('vertical-item').length, 1, 'correct number of items rendered on initial pass');
    assert.equal(find('vertical-item').textContent.trim(), '0 0', 'correct item rendered');
  });

  await waitForRender();

  assert.equal(findAll('vertical-item').length, 1, 'correctly updates the number of items rendered on second pass');
  assert.equal(find('vertical-item').textContent.trim(), '0 0', 'correct first item rendered');
});

testScenarios(
  'The collection renders based on max height of the scroll parent',
  simpleScenariosFor(getNumbers(0, 10)),

  hbs`
    <div class="scrollable with-max-height">
      <div>
        {{#vertical-collection ${'items'}
          containerSelector=".scrollable"
          estimateHeight=20
          staticHeight=staticHeight
          bufferSize=0

          as |item i|}}
          <vertical-item style="height: 20px">
            {{item.number}} {{i}}
          </vertical-item>
        {{/vertical-collection}}
      </div>
    </div>
  `,

  function(assert) {
    assert.equal(findAll('vertical-item').length, 10);
  }
);

testScenarios(
  'The collection renders all items when renderAll is set',
  scenariosFor(getNumbers(0, 20), { renderAll: true }),
  standardTemplate,

  async function(assert) {
    assert.equal(findAll('.vertical-item').length, 20, 'correct number of items rendered');
  }
);

testScenarios(
  'The collection can switch on renderAll after being rendered',
  scenariosFor(getNumbers(0, 20)),
  standardTemplate,

  async function(assert) {
    assert.equal(findAll('.vertical-item').length, 10, 'correct number of items rendered before');

    this.set('renderAll', true);
    await waitForRender();

    assert.equal(findAll('.vertical-item').length, 20, 'correct number of items rendered before');
  }
);
