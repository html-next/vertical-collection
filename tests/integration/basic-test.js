import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import {
  find,
  findAll,
  scrollTo
} from 'ember-native-dom-helpers';
import wait from 'ember-test-helpers/wait';

import getNumbers from 'dummy/lib/get-numbers';

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
  'The collection renders',
  scenariosFor(getNumbers(0, 1)),
  standardTemplate,

  async function(assert) {
    assert.expect(1);
    assert.equal(findAll('.vertical-item').length, 1);
  }
);

testScenarios(
  'The collection renders when content is empty',
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
    await wait();
    const items = await findAll('.vertical-item');
    assert.equal(items.length, 3);
  }
);

testScenarios(
  'The collection renders correct number of components with bufferSize set',
  scenariosFor(getNumbers(0, 10), { estimateHeight: 200, bufferSize: 1 }),
  standardTemplate,

  async function(assert) {
    assert.expect(3);

    // Should render buffer on the bottom
    assert.equal(findAll('.vertical-item').length, 2);

    await scrollTo('.scrollable', 0, 200);

    // Should render buffers on both sides
    assert.equal(findAll('.vertical-item').length, 3);

    await scrollTo('.scrollable', 0, 2000);

    // Should render buffer on the top
    assert.equal(findAll('.vertical-item').length, 2);
  }
);

testScenarios(
  'The collection renders with containerSelector set',
  simpleScenariosFor(getNumbers(0, 10)),

  hbs`
    <div style="height: 100px;" class="scrollable">
      <div>
        {{#vertical-collection items
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
        {{#vertical-collection items
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

    let occludedBoundaries = findAll('.occluded-content');

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
        {{#vertical-collection items
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

    let occludedBoundaries = findAll('.occluded-content');

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
      {{#vertical-collection items
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
      {{#vertical-collection items
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

  assert.equal(findAll('vertical-item').length, 1, 'correct number of items rendered on initial pass');
  assert.equal(find('vertical-item').textContent.trim(), '0 0', 'correct item rendered');

  await wait();

  assert.equal(findAll('vertical-item').length, 10, 'correctly updates the number of items rendered on second pass');
  assert.equal(find('vertical-item:first-of-type').textContent.trim(), '0 0', 'correct first item rendered');
  assert.equal(find('vertical-item:last-of-type').textContent.trim(), '9 9', 'correct last item rendered');
});

test('The collection renders the initialRenderCount correctly if idForFirstItem is set', async function(assert) {
  assert.expect(5);
  this.set('items', getNumbers(0, 100));

  this.render(hbs`
    <div style="height: 500px; width: 500px;" class="scrollable">
      {{#vertical-collection items
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

  assert.equal(findAll('vertical-item').length, 1, 'correct number of items rendered on initial pass');
  assert.equal(find('vertical-item').textContent.trim(), '20 20', 'correct item rendered');

  await wait();

  assert.equal(findAll('vertical-item').length, 12, 'correctly updates the number of items rendered on second pass');
  assert.equal(find('vertical-item:first-of-type').textContent.trim(), '19 19', 'correct first item rendered');
  assert.equal(find('vertical-item:last-of-type').textContent.trim(), '30 30', 'correct last item rendered');
});

test('The collection renders the initialRenderCount correctly if the count is more than the number of items', async function(assert) {
  assert.expect(4);
  this.set('items', getNumbers(0, 1));

  this.render(hbs`
    <div style="height: 500px; width: 500px;" class="scrollable">
      {{#vertical-collection items
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

  await wait();

  assert.equal(findAll('vertical-item').length, 1, 'correctly updates the number of items rendered on second pass');
  assert.equal(find('vertical-item').textContent.trim(), '0 0', 'correct first item rendered');
});

testScenarios(
  'The collection renders in the correctly when starting offscreen',
  scenariosFor(getNumbers(0, 100)),

  hbs`
    <div style="height: 100px;" class="scrollable">
      <div style="padding-top: 400px;">
        {{#vertical-collection items
          containerSelector=".scrollable"
          estimateHeight=20
          bufferSize=2

          as |item i|}}
          <vertical-item style="height: 20px">
            {{item.number}} {{i}}
          </vertical-item>
        {{/vertical-collection}}
      </div>
    </div>
  `,

  async function(assert) {
    assert.expect(2);

    assert.equal(findAll('vertical-item').length, 7, 'Rendered correct number of items');

    await scrollTo('.scrollable', 0, 500);

    assert.equal(findAll('vertical-item').length, 9, 'Rendered correct number of items');
  }
);

testScenarios(
  'The collection respects initial scroll position when rendered',
  simpleScenariosFor(getNumbers(0, 100)),

  hbs`
    <div class="scrollable" style="height: 500px; width: 500px;">
      <div style="height: 1000px; width: 500px;"></div>

      {{#if renderCollection}}
        {{#vertical-collection items estimateHeight="20" as |item|}}
          <div>
            Content
          </div>
        {{/vertical-collection}}
      {{/if}}
    </div>
  `,

  async function(assert) {
    let scrollContainer = find('.scrollable');

    await scrollTo('.scrollable', 0, 500);

    assert.equal(scrollContainer.scrollTop, 500, 'scrolled to correct position');

    this.set('renderCollection', true);

    await wait();

    assert.equal(scrollContainer.scrollTop, 500, 'scroll position remains the same');
  }
);
